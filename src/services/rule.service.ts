import { createClient } from '@/lib/supabase/server'
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
    title: 'Overnight guests',
    description: 'Give roommates at least 24 hours notice before having an overnight guest.',
  },
  {
    title: 'No smoking indoors',
    description: 'Smoking of any kind is not permitted inside the home.',
  },
  {
    title: 'Restock shared supplies',
    description: 'Replace toilet paper, dish soap, or other shared supplies when you use the last of them.',
  },
  {
    title: 'Keep common areas clean',
    description: 'Living room, kitchen, and shared bathrooms should be kept reasonably tidy at all times.',
  },
  {
    title: 'Communicate schedule changes',
    description: 'Let roommates know in advance if your schedule affects shared spaces or parking.',
  },
  {
    title: 'Split utilities equally',
    description: 'All utility bills are split equally unless all roommates agree to a different arrangement.',
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
): Promise<HouseRule | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('house_rules')
    .insert({ household_id: householdId, title, description, active: true })
    .select()
    .single()

  if (error || !data) return null
  return data as HouseRule
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
