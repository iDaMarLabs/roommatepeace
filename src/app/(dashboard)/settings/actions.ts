'use server'

import { requestLeave, cancelLeave } from '@/services/household.service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function requestLeaveAction(
  householdId: string,
  billPayments: { billId: string; amountPaidCents: number }[]
): Promise<{ error?: string }> {
  const result = await requestLeave(householdId, billPayments)

  if (result.error) {
    return { error: result.error }
  }

  if (result.deleted || result.left) {
    redirect('/login')
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return {}
}

export async function cancelLeaveAction(requestId: string): Promise<void> {
  await cancelLeave(requestId)
  revalidatePath('/settings')
  revalidatePath('/dashboard')
}
