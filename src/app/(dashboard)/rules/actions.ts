'use server'

import { revalidatePath } from 'next/cache'
import { acknowledgeRule, createRule, deleteRule, toggleRule } from '@/services/rule.service'

export async function addRuleAction(formData: FormData): Promise<{ error?: string }> {
  const householdId = formData.get('householdId') as string
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim() || null

  if (!title || !householdId) return {}

  const result = await createRule(householdId, title, description)
  if (result.error) return { error: result.error }
  revalidatePath('/rules')
  return {}
}

export async function toggleRuleAction(ruleId: string, active: boolean) {
  await toggleRule(ruleId, active)
  revalidatePath('/rules')
}

export async function acknowledgeRuleAction(ruleId: string) {
  await acknowledgeRule(ruleId)
  revalidatePath('/rules')
}

export async function deleteRuleAction(ruleId: string): Promise<{ error?: string }> {
  const result = await deleteRule(ruleId)
  if (result.error) return { error: result.error }
  revalidatePath('/rules')
  return {}
}
