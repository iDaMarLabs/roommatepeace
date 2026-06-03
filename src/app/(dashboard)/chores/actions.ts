'use server'

import { revalidatePath } from 'next/cache'
import { createChore, pickUpChore, completeChore, deleteChore } from '@/services/chore.service'
import type { RecurrenceType } from '@/types'

export async function addChoreAction(
  formData: FormData
): Promise<{ error?: string }> {
  const householdId = formData.get('householdId') as string
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim() || null
  const recurrenceType = (formData.get('recurrenceType') as RecurrenceType) ?? 'weekly'
  const assignedMode = formData.get('rotate') === 'on' ? 'rotate' : 'fixed'

  if (!title || !householdId) return {}

  const result = await createChore(householdId, title, description, recurrenceType, assignedMode)
  if (result.error) return { error: result.error }

  revalidatePath('/chores')
  return {}
}

export async function pickUpChoreAction(choreId: string) {
  await pickUpChore(choreId)
  revalidatePath('/chores')
}

export async function completeChoreAction(assignmentId: string) {
  await completeChore(assignmentId)
  revalidatePath('/chores')
}

export async function deleteChoreAction(choreId: string): Promise<{ error?: string }> {
  const result = await deleteChore(choreId)
  if (result.error) return { error: result.error }
  revalidatePath('/chores')
  return {}
}
