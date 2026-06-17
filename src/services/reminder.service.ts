import { createAdminClient } from '@/lib/supabase/admin'
import { sendReminderEmail, type ReminderItem } from '@/services/email.service'

interface ReminderItemWithRef extends ReminderItem {
  referenceId: string
}

interface UserReminder {
  userId: string
  email: string
  name: string | null
  items: ReminderItemWithRef[]
}

function todayAndTomorrow(): { todayStr: string; tomorrowStr: string } {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    todayStr: today.toISOString().split('T')[0],
    tomorrowStr: tomorrow.toISOString().split('T')[0],
  }
}

export async function markMissedChores(): Promise<number> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('chore_assignments')
    .update({ status: 'missed' })
    .eq('status', 'pending')
    .lt('due_date', today)
    .select('id')

  return data?.length ?? 0
}

export async function deleteOrphanedAccounts(): Promise<number> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error || !data?.users) return 0

  const oldUsers = data.users.filter(u => u.created_at < cutoff)
  if (oldUsers.length === 0) return 0

  const oldUserIds = oldUsers.map(u => u.id)

  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .in('user_id', oldUserIds)

  const withHousehold = new Set((members ?? []).map(m => m.user_id))
  const orphans = oldUsers.filter(u => !withHousehold.has(u.id))

  let deleted = 0
  for (const orphan of orphans) {
    const { error: delError } = await supabase.auth.admin.deleteUser(orphan.id)
    if (!delError) deleted++
  }

  return deleted
}

export async function sendDailyReminders(): Promise<{ sent: number; errors: number }> {
  const supabase = createAdminClient()
  const { todayStr, tomorrowStr } = todayAndTomorrow()
  const dueDates = [todayStr, tomorrowStr]

  const userMap = new Map<string, UserReminder>()

  function getOrCreate(userId: string, email: string, name: string | null): UserReminder {
    if (!userMap.has(email)) {
      userMap.set(email, { userId, email, name, items: [] })
    }
    return userMap.get(email)!
  }

  function dueLabel(dateStr: string): string {
    return dateStr === todayStr ? 'today' : 'tomorrow'
  }

  const { data: choreAssignments } = await supabase
    .from('chore_assignments')
    .select('id, due_date, chore:chores(title), profile:profiles(id, email, name)')
    .in('due_date', dueDates)
    .eq('status', 'pending')

  for (const row of choreAssignments ?? []) {
    const profile = row.profile as unknown as { id: string; email: string; name: string | null } | null
    const chore = row.chore as unknown as { title: string } | null
    if (!profile?.email || !chore) continue

    getOrCreate(profile.id, profile.email, profile.name).items.push({
      type: 'chore',
      title: chore.title,
      dueLabel: dueLabel(row.due_date),
      referenceId: row.id,
    })
  }

  const { data: billShares } = await supabase
    .from('bill_shares')
    .select('id, amount_cents, bill:bills(title, due_date), profile:profiles(id, email, name)')
    .eq('paid_status', false)

  for (const row of billShares ?? []) {
    const profile = row.profile as unknown as { id: string; email: string; name: string | null } | null
    const bill = row.bill as unknown as { title: string; due_date: string } | null
    if (!profile?.email || !bill) continue
    if (!dueDates.includes(bill.due_date)) continue

    getOrCreate(profile.id, profile.email, profile.name).items.push({
      type: 'bill',
      title: bill.title,
      dueLabel: dueLabel(bill.due_date),
      amountCents: row.amount_cents,
      referenceId: row.id,
    })
  }

  let sent = 0
  let errors = 0
  const eventRows: Array<{
    user_id: string
    type: string
    reference_id: string
    channel: string
  }> = []

  for (const reminder of userMap.values()) {
    if (reminder.items.length === 0) continue
    try {
      await sendReminderEmail(reminder.email, reminder.name, reminder.items)
      sent++
      for (const item of reminder.items) {
        eventRows.push({
          user_id: reminder.userId,
          type: item.type,
          reference_id: item.referenceId,
          channel: 'email',
        })
      }
    } catch {
      errors++
    }
  }

  if (eventRows.length > 0) {
    await supabase.from('reminder_events').insert(eventRows)
  }

  return { sent, errors }
}
