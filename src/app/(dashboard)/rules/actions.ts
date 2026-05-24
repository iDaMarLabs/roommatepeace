'use server'

import { revalidatePath } from 'next/cache'
import { createRule, toggleRule } from '@/services/rule.service'

export async function addRuleAction(formData: FormData) {
  const householdId = formData.get('householdId') as string
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim() || null

  if (!title || !householdId) return

  await createRule(householdId, title, description)
  revalidatePath('/rules')
}

export async function toggleRuleAction(ruleId: string, active: boolean) {
  await toggleRule(ruleId, active)
  revalidatePath('/rules')
}
