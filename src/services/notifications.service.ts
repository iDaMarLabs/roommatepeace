import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type HouseholdNotification = {
  id: string
  household_id: string
  recipient_user_id: string
  message: string
  dismissed: boolean
  created_at: string
}

export async function createNotification(
  householdId: string,
  recipientUserId: string,
  message: string
): Promise<void> {
  const admin = createAdminClient()
  await admin.from('household_notifications').insert({
    household_id: householdId,
    recipient_user_id: recipientUserId,
    message,
  })
}

export async function getNotificationsForUser(
  householdId: string
): Promise<HouseholdNotification[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('household_notifications')
    .select('*')
    .eq('household_id', householdId)
    .eq('recipient_user_id', user.id)
    .eq('dismissed', false)
    .order('created_at', { ascending: false })

  return (data as HouseholdNotification[]) ?? []
}

export async function dismissNotification(notificationId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('household_notifications')
    .update({ dismissed: true })
    .eq('id', notificationId)
}
