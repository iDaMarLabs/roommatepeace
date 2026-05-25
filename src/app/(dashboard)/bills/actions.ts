'use server'

import { revalidatePath } from 'next/cache'
import { createBill, markSharePaid, updateBill } from '@/services/bill.service'

export async function addBillAction(
  formData: FormData
): Promise<{ error?: string }> {
  const householdId = formData.get('householdId') as string
  const title = (formData.get('title') as string).trim()
  const amountDollars = parseFloat(formData.get('amount') as string)
  const dueDate = formData.get('dueDate') as string

  if (!title || !householdId || isNaN(amountDollars) || !dueDate) return {}

  const amountCents = Math.round(amountDollars * 100)
  const result = await createBill(householdId, title, amountCents, dueDate)
  if (result.error) return { error: result.error }

  revalidatePath('/bills')
  return {}
}

export async function editBillAction(formData: FormData): Promise<{ error?: string }> {
  const billId = formData.get('billId') as string
  const title = (formData.get('title') as string).trim()
  const amountDollars = parseFloat(formData.get('amount') as string)
  const dueDate = formData.get('dueDate') as string

  if (!billId || !title || isNaN(amountDollars) || !dueDate) return {}

  const amountCents = Math.round(amountDollars * 100)
  const result = await updateBill(billId, title, amountCents, dueDate)
  if (result.error) return { error: result.error }

  revalidatePath('/bills')
  return {}
}

export async function markSharePaidAction(shareId: string) {
  await markSharePaid(shareId)
  revalidatePath('/bills')
}
