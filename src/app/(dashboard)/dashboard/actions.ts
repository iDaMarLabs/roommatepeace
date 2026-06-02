'use server'

import { regenerateInviteCode, acknowledgeLeave } from '@/services/household.service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function regenerateInviteCodeAction(householdId: string) {
  await regenerateInviteCode(householdId)
  revalidatePath('/dashboard')
}

export async function acknowledgeLeaveAction(departureRequestId: string): Promise<{ error?: string }> {
  const result = await acknowledgeLeave(departureRequestId)
  if (result.error) return { error: result.error }
  revalidatePath('/dashboard')
  revalidatePath('/settings')
  if (result.executed) redirect('/dashboard')
  return {}
}
