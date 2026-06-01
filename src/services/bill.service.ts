import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Bill, BillShare } from '@/types'

export type ShareWithProfile = BillShare & {
  profile: { id: string; name: string | null; email: string } | null
}

export type BillWithShares = Bill & {
  shares: ShareWithProfile[]
}

const DEFAULT_BILLS: { title: string }[] = [
  { title: 'Rent' },
  { title: 'Electricity' },
  { title: 'Gas' },
  { title: 'Water / Sewer' },
  { title: 'Internet / WiFi' },
  { title: 'Renters Insurance' },
]

export async function getBills(householdId: string): Promise<BillWithShares[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('bills')
    .select('*, shares:bill_shares(*, profile:profiles(id, name, email))')
    .eq('household_id', householdId)
    .order('due_date', { ascending: true })

  return (data as BillWithShares[]) ?? []
}

export async function createBill(
  householdId: string,
  title: string,
  amountCents: number,
  dueDate: string,
  recurring = false
): Promise<{ data: Bill | null; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null }

  const { data: household } = await supabase
    .from('households')
    .select('plan_tier')
    .eq('id', householdId)
    .single()

  if (household?.plan_tier === 'free') {
    const { count } = await supabase
      .from('bills')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
    if ((count ?? 0) >= 3) {
      return { data: null, error: 'Free plan is limited to 3 bills. Upgrade to add more.' }
    }
  }

  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', householdId)

  if (!members || members.length === 0) return { data: null }

  const perPersonCents = Math.round(amountCents / members.length)

  const { data: bill, error } = await supabase
    .from('bills')
    .insert({
      household_id: householdId,
      title,
      amount_cents: amountCents,
      due_date: dueDate,
      split_type: 'equal',
      created_by_user_id: user.id,
      status: 'unpaid',
      recurring,
    })
    .select()
    .single()

  if (error || !bill) return { data: null }

  await supabase.from('bill_shares').insert(
    members.map((m) => ({
      bill_id: bill.id,
      user_id: m.user_id,
      amount_cents: perPersonCents,
      paid_status: false,
    }))
  )

  return { data: bill as Bill }
}

export async function updateBill(
  billId: string,
  title: string,
  amountCents: number,
  dueDate: string,
  recurring = false
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: billError } = await supabase
    .from('bills')
    .update({ title, amount_cents: amountCents, due_date: dueDate, recurring })
    .eq('id', billId)

  if (billError) return { error: 'Failed to update bill.' }

  const { data: shares } = await supabase
    .from('bill_shares')
    .select('id')
    .eq('bill_id', billId)

  if (!shares || shares.length === 0) return {}

  const perPersonCents = Math.round(amountCents / shares.length)

  await supabase
    .from('bill_shares')
    .update({ amount_cents: perPersonCents })
    .eq('bill_id', billId)

  return {}
}

export async function deleteBill(billId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: bill } = await supabase
    .from('bills')
    .select('created_by_user_id, household_id')
    .eq('id', billId)
    .maybeSingle()

  if (!bill) return { error: 'Bill not found' }

  const { data: member } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', bill.household_id)
    .eq('user_id', user.id)
    .maybeSingle()

  const isCreator = bill.created_by_user_id === user.id
  const isOwner = member?.role === 'owner'

  if (!isCreator && !isOwner) {
    return { error: 'Only the bill creator or household owner can delete this bill.' }
  }

  const admin = createAdminClient()
  await admin.from('bill_shares').delete().eq('bill_id', billId)

  const { error } = await admin.from('bills').delete().eq('id', billId)
  if (error) return { error: 'Failed to delete bill.' }
  return {}
}

export async function markSharePaid(shareId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: share, error } = await supabase
    .from('bill_shares')
    .update({ paid_status: true, paid_at: new Date().toISOString() })
    .eq('id', shareId)
    .select('bill_id')
    .single()

  if (error || !share) return false

  const { data: allShares } = await supabase
    .from('bill_shares')
    .select('paid_status')
    .eq('bill_id', share.bill_id)

  const allPaid = allShares?.every((s) => s.paid_status)
  if (!allPaid) return true

  const { data: bill } = await supabase
    .from('bills')
    .select('*')
    .eq('id', share.bill_id)
    .single()

  if (!bill?.recurring) return true

  const nextDue = new Date(bill.due_date)
  nextDue.setMonth(nextDue.getMonth() + 1)

  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', bill.household_id)

  if (!members || members.length === 0) return true

  const perPerson = Math.round(bill.amount_cents / members.length)

  const { data: newBill } = await supabase
    .from('bills')
    .insert({
      household_id: bill.household_id,
      title: bill.title,
      amount_cents: bill.amount_cents,
      due_date: nextDue.toISOString().split('T')[0],
      split_type: 'equal',
      created_by_user_id: bill.created_by_user_id,
      status: 'unpaid',
      recurring: true,
    })
    .select()
    .single()

  if (newBill) {
    await supabase.from('bill_shares').insert(
      members.map((m) => ({
        bill_id: newBill.id,
        user_id: m.user_id,
        amount_cents: perPerson,
        paid_status: false,
      }))
    )
  }

  return true
}

export async function getUnpaidBillsForMember(
  householdId: string,
  userId: string
): Promise<{ id: string; title: string; amount_cents: number; myShareCents: number }[]> {
  const supabase = await createClient()
  const { data: bills } = await supabase
    .from('bills')
    .select('id, title, amount_cents, bill_shares(amount_cents, paid_status, user_id)')
    .eq('household_id', householdId)

  if (!bills) return []

  const result: { id: string; title: string; amount_cents: number; myShareCents: number }[] = []
  for (const bill of bills) {
    const myShare = (bill.bill_shares as { amount_cents: number; paid_status: boolean; user_id: string }[])
      ?.find((s) => s.user_id === userId && !s.paid_status)
    if (myShare) {
      result.push({
        id: bill.id,
        title: bill.title,
        amount_cents: bill.amount_cents,
        myShareCents: myShare.amount_cents,
      })
    }
  }
  return result
}

export async function seedDefaultBills(householdId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const dueDate = new Date()
  dueDate.setDate(1)
  dueDate.setMonth(dueDate.getMonth() + 1)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  const { data: bills } = await supabase
    .from('bills')
    .insert(
      DEFAULT_BILLS.map((b) => ({
        household_id: householdId,
        title: b.title,
        amount_cents: 0,
        due_date: dueDateStr,
        split_type: 'equal',
        created_by_user_id: userId,
        status: 'unpaid',
      }))
    )
    .select()

  if (!bills) return

  await supabase.from('bill_shares').insert(
    bills.map((bill) => ({
      bill_id: bill.id,
      user_id: userId,
      amount_cents: 0,
      paid_status: false,
    }))
  )
}
