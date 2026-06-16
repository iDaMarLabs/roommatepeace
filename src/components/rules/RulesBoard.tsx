'use client'

import { useState, useTransition } from 'react'
import { BookOpen, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { addRuleAction, acknowledgeRuleAction, toggleRuleAction, deleteRuleAction } from '@/app/(dashboard)/rules/actions'
import type { HouseRule, HouseholdMember, RuleAcknowledgement } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props {
  householdId: string
  currentUserId: string
  rules: HouseRule[]
  members: HouseholdMember[]
  acknowledgements: RuleAcknowledgement[]
}

export default function RulesBoard({ householdId, currentUserId, rules, members, acknowledgements }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd(formData: FormData) {
    setFormError('')
    startTransition(async () => {
      const result = await addRuleAction(formData)
      if (result?.error) {
        setFormError(result.error)
      } else {
        setShowForm(false)
      }
    })
  }

  function handleToggle(ruleId: string, currentActive: boolean) {
    startTransition(() => toggleRuleAction(ruleId, !currentActive))
  }

  function handleAcknowledge(ruleId: string) {
    startTransition(() => acknowledgeRuleAction(ruleId))
  }

  function handleDelete(ruleId: string) {
    setDeleteError('')
    startTransition(async () => {
      const result = await deleteRuleAction(ruleId)
      if (result?.error) {
        setDeleteError(result.error)
        setConfirmDeleteId(ruleId)
      } else {
        setConfirmDeleteId(null)
      }
    })
  }

  const active = rules.filter((r) => r.active)
  const inactive = rules.filter((r) => !r.active)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add Rule'}
        </Button>
      </div>

      {showForm && (
        <form action={handleAdd} className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-4">New rule</h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {formError.includes('Upgrade') ? (
                <>
                  {formError.split('Upgrade')[0]}
                  <Link href="/dashboard" className="font-semibold underline">Upgrade</Link>
                  {formError.split('Upgrade')[1]}
                </>
              ) : formError}
            </div>
          )}
          <input type="hidden" name="householdId" value={householdId} />
          <div className="space-y-4">
            <Input
              label="Rule title"
              name="title"
              type="text"
              required
              placeholder="e.g. No dishes in the sink overnight"
            />
            <Input
              label="Details (optional)"
              name="description"
              type="text"
              placeholder="Any clarification or exceptions"
            />
            <Button type="submit" fullWidth disabled={isPending}>
              {isPending ? 'Adding...' : 'Add rule'}
            </Button>
          </div>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
            <BookOpen size={22} className="text-stone-400" />
          </div>
          <p className="text-stone-500 text-sm">No rules yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.length > 0 && (
            <>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Active</p>
              {active.map((rule) => {
                const ruleAcks = acknowledgements.filter((a) => a.rule_id === rule.id)
                const iAcknowledged = ruleAcks.some((a) => a.user_id === currentUserId)

                return (
                  <div key={rule.id} className="bg-white border border-stone-200 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-3 min-w-0">
                        <p className="font-semibold text-stone-900 text-sm leading-snug">{rule.title}</p>
                        {rule.description && (
                          <p className="text-stone-500 text-xs mt-0.5">{rule.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setConfirmDeleteId(rule.id); setDeleteError('') }}
                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete rule"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggle(rule.id, rule.active)}
                          disabled={isPending}
                          className="text-xs px-2 py-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>

                    {confirmDeleteId === rule.id && (
                      <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                        <p className="text-sm text-red-700 font-medium">
                          Delete this rule? This cannot be undone.
                        </p>
                        {deleteError && (
                          <p className="text-xs text-red-600">{deleteError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(rule.id)}
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

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {members.map((m) => {
                          const acked = ruleAcks.some((a) => a.user_id === m.user_id)
                          const isMe = m.user_id === currentUserId
                          const name = isMe
                            ? 'You'
                            : (m.profile?.name ?? m.profile?.email?.split('@')[0] ?? 'Roommate')
                          return (
                            <span
                              key={m.id}
                              className={`flex items-center gap-1 text-xs ${acked ? 'text-emerald-600' : 'text-stone-400'}`}
                            >
                              <span>{acked ? '✓' : '○'}</span>
                              {name}
                            </span>
                          )
                        })}
                      </div>
                      {!iAcknowledged && (
                        <button
                          onClick={() => handleAcknowledge(rule.id)}
                          disabled={isPending}
                          className="shrink-0 text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {inactive.length > 0 && (
            <>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mt-6 mb-2">Inactive</p>
              {inactive.map((rule) => (
                <div key={rule.id} className="bg-stone-50 border border-stone-200 rounded-2xl px-5 py-4 shadow-sm opacity-60">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-3 min-w-0">
                      <p className="font-medium text-stone-500 line-through text-sm">{rule.title}</p>
                      {rule.description && (
                        <p className="text-stone-400 text-xs mt-0.5">{rule.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setConfirmDeleteId(rule.id); setDeleteError('') }}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Delete rule"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggle(rule.id, rule.active)}
                        disabled={isPending}
                        className="text-xs px-2 py-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    </div>
                  </div>

                  {confirmDeleteId === rule.id && (
                    <div className="mt-3 pt-3 border-t border-stone-200 space-y-2">
                      <p className="text-sm text-red-700 font-medium">
                        Delete this rule? This cannot be undone.
                      </p>
                      {deleteError && (
                        <p className="text-xs text-red-600">{deleteError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(rule.id)}
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
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
