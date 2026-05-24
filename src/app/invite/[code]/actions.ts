'use server'

import { joinHousehold } from '@/services/household.service'
import { revalidatePath } from 'next/cache'

export async function joinHouseholdAction(
  inviteCode: string
): Promise<{ success: boolean; error?: string }> {
  const result = await joinHousehold(inviteCode)
  if (result.success) {
    revalidatePath('/dashboard')
  }
  return result
}
