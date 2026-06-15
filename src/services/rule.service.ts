import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { HouseRule, RuleAcknowledgement } from '@/types'

const DEFAULT_RULES: { title: string; description: string }[] = [
  {
    title: 'Quiet hours',
    description: 'Keep noise down after 11pm on weeknights and midnight on weekends.',
  },
  {
    title: 'Clean up after cooking',
    description: 'Wash dishes and wipe down surfaces within 24 hours of cooking.',
  },
  {
    title: 'Keep common areas clean',
    description: 'Living room, kitchen, and shared bathrooms should be kept reasonably tidy at all times.',
  },
]

export async function getRules(householdId: string): Promise<HouseRule[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('house_rules')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })

  return (data as HouseRule[]) ?? []
}

export async function createRule(
  householdId: string,
  title: string,
  description: string | null
): Promise<{ data: HouseRule | null; error?: string }> {
  const supabase = await createClient()

  const { data: household } = await supabase
    .from('households')
    .select('plan_tier')
    .eq('id', householdId)
    .single()

  if (household?.plan_tier === 'free') {
    const { count } = await supabase
      .from('house_rules')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
    if ((count ?? 0) >= 3) {
      return { data: null, error: 'Free plan is limited to 3 rules. Upgrade to add more.' }
    }
  }

  const { data, error } = await supabase
    .from('house_rules')
    .insert({ household_id: householdId, title, description, active: true })
    .select()
    .single()

  if (error || !data) return { data: null }
  return { data: data as HouseRule }
}

export async function toggleRule(ruleId: string, active: boolean): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('house_rules')
    .update({ active })
    .eq('id', ruleId)
  return !error
}

export async function getAcknowledgements(ruleIds: string[]): Promise<RuleAcknowledgement[]> {
  if (ruleIds.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('rule_acknowledgements')
    .select('*, profile:profiles(id, name, email)')
    .in('rule_id', ruleIds)
  return (data as RuleAcknowledgement[]) ?? []
}

export async function acknowledgeRule(ruleId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('rule_acknowledgements')
    .insert({ rule_id: ruleId, user_id: user.id, acknowledged_at: new Date().toISOString() })
  return !error
}

export async function deleteRule(ruleId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: rule } = await supabase
    .from('house_rules')
    .select('household_id')
    .eq('id', ruleId)
    .maybeSingle()

  if (!rule) return { error: 'Rule not found' }

  const { data: member } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', rule.household_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (member?.role !== 'owner') {
    return { error: 'Only the household owner can delete rules.' }
  }

  const admin = createAdminClient()
  await admin.from('rule_acknowledgements').delete().eq('rule_id', ruleId)

  const { error } = await admin.from('house_rules').delete().eq('id', ruleId)
  if (error) return { error: 'Failed to delete rule.' }
  return {}
}

export async function seedDefaultRules(householdId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('house_rules').insert(
    DEFAULT_RULES.map((r) => ({
      household_id: householdId,
      title: r.title,
      description: r.description,
      active: true,
    }))
  )
}
