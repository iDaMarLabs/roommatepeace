import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { seedDefaultChores } from '@/services/chore.service'
import { seedDefaultBills } from '@/services/bill.service'
import { seedDefaultRules } from '@/services/rule.service'
import type { Household, HouseholdMember } from '@/types'

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

  if (household.plan_tier === 'free' && (count ?? 0) >= 3) {
    return {
      success: false,
      error: 'This household has reached the 3-member limit on the free plan',
    }
  }

  const { error } = await supabase
    .from('household_members')
    .insert({ household_id: household.id, user_id: user.id, role: 'member' })

  if (error) return { success: false, error: 'Failed to join household' }
  return { success: true }
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
