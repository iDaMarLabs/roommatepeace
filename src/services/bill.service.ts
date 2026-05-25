import { createClient } from '@/lib/supabase/server'
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
  dueDate: string
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
  dueDate: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: billError } = await supabase
    .from('bills')
    .update({ title, amount_cents: amountCents, due_date: dueDate })
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

export async function markSharePaid(shareId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bill_shares')
    .update({ paid_status: true, paid_at: new Date().toISOString() })
    .eq('id', shareId)
  return !error
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
