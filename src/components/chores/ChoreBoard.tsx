'use client'

import { useState, useTransition } from 'react'
import {
  addChoreAction,
  pickUpChoreAction,
  completeChoreAction,
} from '@/app/(dashboard)/chores/actions'
import type { ChoreWithAssignment, AssignmentWithProfile } from '@/services/chore.service'

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

export default function ChoreBoard({ householdId, currentUserId, chores }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Chore'}
        </button>
      </div>

      {showForm && (
        <form action={handleAdd} className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-stone-900 mb-4">New chore</h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {formError}
            </div>
          )}
          <input type="hidden" name="householdId" value={householdId} />
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Chore name
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. Take out trash"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Description (optional)
              </label>
              <input
                name="description"
                type="text"
                placeholder="Any extra details"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Repeats
              </label>
              <select
                name="recurrenceType"
                defaultValue="weekly"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
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
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {isPending ? 'Adding...' : 'Add chore'}
            </button>
          </div>
        </form>
      )}

      {chores.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          No chores yet. Add one above.
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
                className="bg-white border border-stone-200 rounded-2xl px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-stone-900">{chore.title}</p>
                  {chore.description && (
                    <p className="text-stone-500 text-sm mt-0.5">{chore.description}</p>
                  )}
                  <p className="text-stone-400 text-xs mt-1 capitalize">
                    {chore.recurrence_type === 'none' ? 'One-time' : chore.recurrence_type}
                    {chore.assigned_mode === 'rotate' && ' · Rotating'}
                    {isMyChore && assignment && ` · You · Due ${assignment.due_date}`}
                    {!isUnassigned && !isMyChore && ` · ${assignment?.profile?.name ?? assignment?.profile?.email ?? 'A roommate'} · Due ${assignment?.due_date}`}
                  </p>
                </div>

                <div className="ml-4 shrink-0">
                  {isUnassigned && (
                    <button
                      onClick={() => handlePickUp(chore.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 text-sm border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Pick Up
                    </button>
                  )}
                  {isMyChore && (
                    <button
                      onClick={() => handleComplete(assignment.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Mark Done
                    </button>
                  )}
                  {!isUnassigned && !isMyChore && (
                    <span className="text-stone-400 text-xs">
                      {assignment?.profile?.name ?? assignment?.profile?.email ?? 'A roommate'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
