import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Chore, ChoreAssignment, RecurrenceType, AssignedMode } from '@/types'

const DEFAULT_CHORES: { title: string; recurrence_type: RecurrenceType }[] = [
  { title: 'Take out trash', recurrence_type: 'weekly' },
  { title: 'Take out recycling', recurrence_type: 'weekly' },
  { title: 'Vacuum / sweep floors', recurrence_type: 'weekly' },
  { title: 'Mop floors', recurrence_type: 'biweekly' },
  { title: 'Clean bathroom sink & toilet', recurrence_type: 'weekly' },
  { title: 'Clean shower / tub', recurrence_type: 'biweekly' },
  { title: 'Wipe down kitchen counters', recurrence_type: 'weekly' },
  { title: 'Clean stovetop', recurrence_type: 'weekly' },
  { title: 'Wash dishes / run dishwasher', recurrence_type: 'daily' },
  { title: 'Empty dishwasher', recurrence_type: 'daily' },
  { title: 'Do laundry', recurrence_type: 'weekly' },
  { title: 'Wipe down common surfaces', recurrence_type: 'weekly' },
]

export async function seedDefaultChores(householdId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('chores').insert(
    DEFAULT_CHORES.map((c) => ({
      household_id: householdId,
      title: c.title,
      description: null,
      recurrence_type: c.recurrence_type,
      recurrence_interval: 1,
      assigned_mode: 'fixed',
      active: true,
    }))
  )
}

export type AssignmentWithProfile = ChoreAssignment & {
  profile: { id: string; name: string | null; email: string } | null
}

export type ChoreWithAssignment = Chore & {
  current_assignment: AssignmentWithProfile | null
}

export async function getChores(householdId: string): Promise<ChoreWithAssignment[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('chores')
    .select('*, chore_assignments(*, profile:profiles(id, name, email))')
    .eq('household_id', householdId)
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (!data) return []

  return data.map((chore) => {
    const assignments: AssignmentWithProfile[] = chore.chore_assignments ?? []
    const pending = assignments.find((a) => a.status === 'pending') ?? null
    return { ...chore, chore_assignments: undefined, current_assignment: pending }
  })
}

export async function createChore(
  householdId: string,
  title: string,
  description: string | null,
  recurrenceType: RecurrenceType,
  assignedMode: AssignedMode = 'fixed'
): Promise<{ data: Chore | null; error?: string }> {
  const supabase = await createClient()

  const { data: household } = await supabase
    .from('households')
    .select('plan_tier')
    .eq('id', householdId)
    .single()

  if (household?.plan_tier === 'free') {
    const { count } = await supabase
      .from('chores')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('active', true)
    if ((count ?? 0) >= 10) {
      return { data: null, error: 'Free plan is limited to 10 chores. Upgrade to add more.' }
    }
  }

  const { data, error } = await supabase
    .from('chores')
    .insert({
      household_id: householdId,
      title,
      description,
      recurrence_type: recurrenceType,
      recurrence_interval: 1,
      assigned_mode: assignedMode,
      active: true,
    })
    .select()
    .single()

  if (error || !data) return { data: null }
  return { data: data as Chore }
}

export async function pickUpChore(choreId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)

  const { error } = await supabase.from('chore_assignments').insert({
    chore_id: choreId,
    assigned_user_id: user.id,
    due_date: dueDate.toISOString().split('T')[0],
    status: 'pending',
  })

  return !error
}

function nextDueDate(recurrenceType: RecurrenceType): string | null {
  const d = new Date()
  switch (recurrenceType) {
    case 'daily': d.setDate(d.getDate() + 1); break
    case 'weekly': d.setDate(d.getDate() + 7); break
    case 'biweekly': d.setDate(d.getDate() + 14); break
    case 'monthly': d.setMonth(d.getMonth() + 1); break
    case 'none': return null
  }
  return d.toISOString().split('T')[0]
}

export async function completeChore(assignmentId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: assignment, error: updateError } = await supabase
    .from('chore_assignments')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select('chore_id, assigned_user_id')
    .single()

  if (updateError || !assignment) return false

  const { data: chore } = await supabase
    .from('chores')
    .select('household_id, assigned_mode, recurrence_type')
    .eq('id', assignment.chore_id)
    .single()

  if (!chore || chore.assigned_mode !== 'rotate') return true

  const dueDate = nextDueDate(chore.recurrence_type as RecurrenceType)
  if (!dueDate) return true

  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', chore.household_id)
    .order('joined_at', { ascending: true })

  if (!members || members.length === 0) return true

  const currentIndex = members.findIndex((m) => m.user_id === assignment.assigned_user_id)
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % members.length
  const nextUserId = members[nextIndex].user_id

  await supabase.from('chore_assignments').insert({
    chore_id: assignment.chore_id,
    assigned_user_id: nextUserId,
    due_date: dueDate,
    status: 'pending',
  })

  return true
}

export async function deleteChore(choreId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: chore } = await supabase
    .from('chores')
    .select('household_id')
    .eq('id', choreId)
    .maybeSingle()

  if (!chore) return { error: 'Chore not found' }

  const { data: member } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', chore.household_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (member?.role !== 'owner') {
    return { error: 'Only the household owner can delete chores.' }
  }

  const admin = createAdminClient()
  await admin.from('chore_assignments').delete().eq('chore_id', choreId)

  const { error } = await admin.from('chores').delete().eq('id', choreId)
  if (error) return { error: 'Failed to delete chore.' }
  return {}
}
