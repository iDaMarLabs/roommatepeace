'use client'

import { useState, useTransition } from 'react'
import { CheckSquare, Trash2 } from 'lucide-react'
import {
  addChoreAction,
  pickUpChoreAction,
  completeChoreAction,
  deleteChoreAction,
} from '@/app/(dashboard)/chores/actions'
import type { ChoreWithAssignment } from '@/services/chore.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'none', label: 'One-time' },
]

interface Props {
  householdId: string
  currentUserId: string
  chores: ChoreWithAssignment[]
}

function choreMetadata(chore: ChoreWithAssignment, currentUserId: string): string {
  const recurrence =
    chore.recurrence_type === 'none'
      ? 'One-time'
      : chore.recurrence_type === 'biweekly'
      ? 'Every 2 weeks'
      : chore.recurrence_type.charAt(0).toUpperCase() + chore.recurrence_type.slice(1)

  const parts: string[] = [recurrence]
  if (chore.assigned_mode === 'rotate') parts.push('Rotating')

  const a = chore.current_assignment
  if (a) {
    const isMe = a.assigned_user_id === currentUserId
    parts.push(isMe ? 'You' : (a.profile?.name ?? a.profile?.email ?? 'A roommate'))
    parts.push(`Due ${a.due_date}`)
  }

  return parts.join(' · ')
}

export default function ChoreBoard({ householdId, currentUserId, chores }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd(formData: FormData) {
    setFormError('')
    startTransition(async () => {
      const result = await addChoreAction(formData)
      if (result?.error) {
        setFormError(result.error)
      } else {
        setShowForm(false)
      }
    })
  }

  function handlePickUp(choreId: string) {
    startTransition(() => pickUpChoreAction(choreId))
  }

  function handleComplete(assignmentId: string) {
    startTransition(() => completeChoreAction(assignmentId))
  }

  function handleDelete(choreId: string) {
    setDeleteError('')
    startTransition(async () => {
      const result = await deleteChoreAction(choreId)
      if (result?.error) {
        setDeleteError(result.error)
        setConfirmDeleteId(choreId)
      } else {
        setConfirmDeleteId(null)
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add Chore'}
        </Button>
      </div>

      {showForm && (
        <form action={handleAdd} className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-4">New chore</h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {formError}
            </div>
          )}
          <input type="hidden" name="householdId" value={householdId} />
          <div className="space-y-4">
            <Input
              label="Chore name"
              name="title"
              type="text"
              required
              placeholder="e.g. Take out trash"
            />
            <Input
              label="Description (optional)"
              name="description"
              type="text"
              placeholder="Any extra details"
            />
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Repeats
              </label>
              <select
                name="recurrenceType"
                defaultValue="weekly"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
              >
                {RECURRENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="rotate"
                className="w-4 h-4 rounded border-stone-300 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-stone-700">Rotate between roommates</span>
            </label>
            <Button type="submit" fullWidth disabled={isPending}>
              {isPending ? 'Adding...' : 'Add chore'}
            </Button>
          </div>
        </form>
      )}

      {chores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CheckSquare size={22} className="text-emerald-500" />
          </div>
          <p className="text-stone-500 text-sm">No chores yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chores.map((chore) => {
            const assignment = chore.current_assignment
            const isMyChore = assignment?.assigned_user_id === currentUserId
            const isUnassigned = !assignment

            return (
              <div
                key={chore.id}
                className={`bg-white border border-stone-200 rounded-2xl px-5 py-4 shadow-sm ${
                  isUnassigned ? 'border-l-2 border-l-amber-300' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 mr-3">
                    <p className="font-semibold text-stone-900 text-sm leading-snug">
                      {chore.title}
                    </p>
                    {chore.description && (
                      <p className="text-stone-500 text-xs mt-0.5">{chore.description}</p>
                    )}
                    <p className="text-stone-400 text-xs mt-1">
                      {choreMetadata(chore, currentUserId)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setConfirmDeleteId(chore.id)
                        setDeleteError('')
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete chore"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isUnassigned && (
                      <Button
                        variant="ghost-emerald"
                        onClick={() => handlePickUp(chore.id)}
                        disabled={isPending}
                      >
                        Pick Up
                      </Button>
                    )}
                    {isMyChore && (
                      <Button
                        variant="primary"
                        onClick={() => handleComplete(assignment.id)}
                        disabled={isPending}
                      >
                        Mark Done
                      </Button>
                    )}
                  </div>
                </div>

                {confirmDeleteId === chore.id && (
                  <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                    <p className="text-sm text-red-700 font-medium">
                      Delete this chore? This cannot be undone.
                    </p>
                    {deleteError && (
                      <p className="text-xs text-red-600">{deleteError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(chore.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isPending ? 'Deleting...' : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(null); setDeleteError('') }}
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
