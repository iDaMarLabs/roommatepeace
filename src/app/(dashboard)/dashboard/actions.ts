'use server'

import { regenerateInviteCode, acknowledgeLeave, forceCompleteLeave } from '@/services/household.service'
import { dismissNotification } from '@/services/notifications.service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function regenerateInviteCodeAction(householdId: string) {
  await regenerateInviteCode(householdId)
  revalidatePath('/dashboard')
}

export async function dismissNotificationAction(notificationId: string): Promise<void> {
  await dismissNotification(notificationId)
}

export async function acknowledgeLeaveAction(departureRequestId: string): Promise<{ error?: string }> {
  const result = await acknowledgeLeave(departureRequestId)
  if (result.error) return { error: result.error }
  revalidatePath('/dashboard')
  revalidatePath('/settings')
  if (result.executed) redirect('/dashboard')
  return {}
}

export async function forceLeaveAction(departureRequestId: string): Promise<{ error?: string }> {
  const result = await forceCompleteLeave(departureRequestId)
  if (result.error) return { error: result.error }
  revalidatePath('/dashboard')
  revalidatePath('/settings')
  redirect('/dashboard')
}
