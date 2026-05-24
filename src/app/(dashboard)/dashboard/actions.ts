'use server'

import { regenerateInviteCode } from '@/services/household.service'
import { revalidatePath } from 'next/cache'

export async function regenerateInviteCodeAction(householdId: string) {
  await regenerateInviteCode(householdId)
  revalidatePath('/dashboard')
}
