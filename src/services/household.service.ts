import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { seedDefaultChores } from '@/services/chore.service'
import { seedDefaultBills, recalculateSharesForNewMember } from '@/services/bill.service'
import { seedDefaultRules } from '@/services/rule.service'
import { createNotification } from '@/services/notifications.service'
import type { Household, HouseholdMember, DepartureRequest } from '@/types'

export async function getUserHousehold(): Promise<Household | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('household_members')
    .select('household_id, households(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return (data?.households as unknown as Household) ?? null
}

export async function getHouseholdMembers(
  householdId: string
): Promise<HouseholdMember[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('household_members')
    .select('*, profile:profiles(*)')
    .eq('household_id', householdId)

  return (data as HouseholdMember[]) ?? []
}

export async function createHousehold(name: string): Promise<Household | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: household, error } = await supabase
    .from('households')
    .insert({ name, owner_user_id: user.id })
    .select()
    .single()

  if (error || !household) return null

  await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: user.id,
    role: 'owner',
  })

  await seedDefaultChores(household.id)
  await seedDefaultBills(household.id, user.id)
  await seedDefaultRules(household.id)

  return household as Household
}

export async function getHouseholdByInviteCode(inviteCode: string): Promise<Household | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('households')
    .select('*')
    .eq('invite_code', inviteCode)
    .maybeSingle()
  return (data as Household) ?? null
}

export async function joinHousehold(
  inviteCode: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const household = await getHouseholdByInviteCode(inviteCode)
  if (!household) return { success: false, error: 'Invalid invite link' }

  const { data: existing } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', household.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { success: true }

  const { count } = await supabase
    .from('household_members')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', household.id)

  if (household.plan_tier === 'free' && (count ?? 0) >= 2) {
    return {
      success: false,
      error: 'This household has reached the 2-member limit on the Free Plan for a Limited Time',
    }
  }

  const { error } = await supabase
    .from('household_members')
    .insert({ household_id: household.id, user_id: user.id, role: 'member' })

  if (error) return { success: false, error: 'Failed to join household' }

  await recalculateSharesForNewMember(household.id, user.id)

  return { success: true }
}

export async function getPendingDepartureRequest(
  householdId: string
): Promise<DepartureRequest | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('departure_requests')
    .select(`
      *,
      profile:profiles(id, name, email),
      bill_payments:departure_bill_payments(*, bill:bills(id, title, amount_cents)),
      acknowledgements:departure_acknowledgements(*)
    `)
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .maybeSingle()
  return (data as unknown as DepartureRequest) ?? null
}

export async function requestLeave(
  householdId: string,
  billPayments: { billId: string; amountPaidCents: number; paymentNote?: string }[]
): Promise<{ error?: string; left?: boolean; pending?: boolean; deleted?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return { error: 'Not a member of this household' }

  if (member.role === 'owner') {
    const { count } = await supabase
      .from('household_members')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)

    if ((count ?? 0) > 1) {
      return { error: 'owner-blocked' }
    }

    await deleteHousehold(householdId)
    return { deleted: true }
  }

  if (billPayments.length === 0) {
    await executeLeave(householdId, user.id)
    return { left: true }
  }

  const admin = createAdminClient()

  // Clear any prior requests for this user before inserting a fresh one
  await admin
    .from('departure_requests')
    .delete()
    .eq('household_id', householdId)
    .eq('requesting_user_id', user.id)

  const { data: request, error } = await admin
    .from('departure_requests')
    .insert({ household_id: householdId, requesting_user_id: user.id, status: 'pending' })
    .select()
    .single()

  if (error || !request) return { error: `Failed to create departure request: ${error?.message ?? 'no data returned'}` }

  if (billPayments.length > 0) {
    await admin.from('departure_bill_payments').insert(
      billPayments.map((p) => ({
        departure_request_id: request.id,
        bill_id: p.billId,
        amount_paid_cents: p.amountPaidCents,
        payment_note: p.paymentNote ?? null,
      }))
    )
  }

  const { data: household } = await supabase
    .from('households')
    .select('owner_user_id')
    .eq('id', householdId)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  if (household?.owner_user_id && household.owner_user_id !== user.id) {
    const leaveMsg = `${profile?.name ?? 'A member'} has requested to leave the household.`
    // Remove any prior (stale) leave-request notification before creating a fresh one
    await admin
      .from('household_notifications')
      .delete()
      .eq('household_id', householdId)
      .eq('recipient_user_id', household.owner_user_id)
      .eq('message', leaveMsg)
    await createNotification(householdId, household.owner_user_id, leaveMsg)
  }

  return { pending: true }
}

export async function cancelLeave(departureRequestId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('departure_requests')
    .update({ status: 'cancelled' })
    .eq('id', departureRequestId)
    .eq('requesting_user_id', user.id)
}

export async function acknowledgeLeave(
  departureRequestId: string
): Promise<{ executed: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { executed: false, error: 'Not authenticated' }

  const admin = createAdminClient()

  const { error: ackError } = await admin
    .from('departure_acknowledgements')
    .insert({ departure_request_id: departureRequestId, member_user_id: user.id })

  if (ackError) return { executed: false, error: 'Failed to acknowledge' }

  const { data: request } = await admin
    .from('departure_requests')
    .select('household_id, requesting_user_id')
    .eq('id', departureRequestId)
    .eq('status', 'pending')
    .maybeSingle()

  if (!request) return { executed: false }

  const { count: remainingCount } = await admin
    .from('household_members')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', request.household_id)
    .neq('user_id', request.requesting_user_id)

  const { count: ackCount } = await admin
    .from('departure_acknowledgements')
    .select('id', { count: 'exact', head: true })
    .eq('departure_request_id', departureRequestId)

  if ((ackCount ?? 0) >= (remainingCount ?? 1)) {
    await executeLeave(request.household_id, request.requesting_user_id, departureRequestId)
    return { executed: true }
  }

  return { executed: false }
}

async function executeLeave(
  householdId: string,
  leavingUserId: string,
  departureRequestId?: string
): Promise<void> {
  const admin = createAdminClient()

  // Clear pending chore assignments
  await admin
    .from('chore_assignments')
    .delete()
    .eq('assigned_user_id', leavingUserId)
    .eq('status', 'pending')

  // Process bill payments if this was a pending departure with bills
  if (departureRequestId) {
    const { data: payments } = await admin
      .from('departure_bill_payments')
      .select('bill_id, amount_paid_cents')
      .eq('departure_request_id', departureRequestId)

    for (const payment of payments ?? []) {
      const { data: bill } = await admin
        .from('bills')
        .select('amount_cents')
        .eq('id', payment.bill_id)
        .single()

      if (!bill) continue

      const newTotal = Math.max(0, bill.amount_cents - payment.amount_paid_cents)

      await admin
        .from('bills')
        .update({ amount_cents: newTotal })
        .eq('id', payment.bill_id)

      await admin
        .from('bill_shares')
        .delete()
        .eq('bill_id', payment.bill_id)
        .eq('user_id', leavingUserId)

      const { data: remainingShares } = await admin
        .from('bill_shares')
        .select('id')
        .eq('bill_id', payment.bill_id)

      const remainingCount = remainingShares?.length ?? 0
      if (remainingCount > 0) {
        const perPerson = Math.round(newTotal / remainingCount)
        await admin
          .from('bill_shares')
          .update({ amount_cents: perPerson })
          .eq('bill_id', payment.bill_id)
      }
    }

    await admin
      .from('departure_requests')
      .update({ status: 'completed' })
      .eq('id', departureRequestId)
  }

  await admin
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', leavingUserId)
}

async function deleteHousehold(householdId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('households').delete().eq('id', householdId)
}

export async function renameHousehold(
  householdId: string,
  name: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (member?.role !== 'owner') {
    return { error: 'Only the household owner can rename the household.' }
  }

  const { error } = await supabase
    .from('households')
    .update({ name })
    .eq('id', householdId)

  if (error) return { error: 'Failed to rename household.' }
  return {}
}

export async function regenerateInviteCode(householdId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('households')
    .update({ invite_code: crypto.randomUUID() })
    .eq('id', householdId)
    .select('invite_code')
    .single()
  return data?.invite_code ?? null
}
