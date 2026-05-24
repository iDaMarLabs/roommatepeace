'use client'

import { useState, useTransition } from 'react'
import { addRuleAction, toggleRuleAction } from '@/app/(dashboard)/rules/actions'
import type { HouseRule } from '@/types'

interface Props {
  householdId: string
  rules: HouseRule[]
}

export default function RulesBoard({ householdId, rules }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addRuleAction(formData)
      setShowForm(false)
    })
  }

  function handleToggle(ruleId: string, currentActive: boolean) {
    startTransition(() => toggleRuleAction(ruleId, !currentActive))
  }

  const active = rules.filter((r) => r.active)
  const inactive = rules.filter((r) => !r.active)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {showForm && (
        <form action={handleAdd} className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-stone-900 mb-4">New rule</h2>
          <input type="hidden" name="householdId" value={householdId} />
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Rule title</label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. No dishes in the sink overnight"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Details (optional)</label>
              <input
                name="description"
                type="text"
                placeholder="Any clarification or exceptions"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {isPending ? 'Adding...' : 'Add rule'}
            </button>
          </div>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          No rules yet. Add one above.
        </div>
      ) : (
        <div className="space-y-3">
          {active.length > 0 && (
            <>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Active</p>
              {active.map((rule) => (
                <div key={rule.id} className="bg-white border border-stone-200 rounded-2xl px-6 py-4 flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    <p className="font-medium text-stone-900">{rule.title}</p>
                    {rule.description && (
                      <p className="text-stone-500 text-sm mt-0.5">{rule.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggle(rule.id, rule.active)}
                    disabled={isPending}
                    className="shrink-0 text-xs text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                </div>
              ))}
            </>
          )}

          {inactive.length > 0 && (
            <>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mt-6">Inactive</p>
              {inactive.map((rule) => (
                <div key={rule.id} className="bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 flex items-start justify-between opacity-60">
                  <div className="flex-1 mr-4">
                    <p className="font-medium text-stone-500 line-through">{rule.title}</p>
                    {rule.description && (
                      <p className="text-stone-400 text-sm mt-0.5">{rule.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggle(rule.id, rule.active)}
                    disabled={isPending}
                    className="shrink-0 text-xs text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Reactivate
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
