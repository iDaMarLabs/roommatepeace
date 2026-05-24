'use client'

import { useState, useTransition } from 'react'
import { addBillAction, markSharePaidAction } from '@/app/(dashboard)/bills/actions'
import type { BillWithShares } from '@/services/bill.service'

interface Props {
  householdId: string
  currentUserId: string
  bills: BillWithShares[]
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function BillBoard({ householdId, currentUserId, bills }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd(formData: FormData) {
    setFormError('')
    startTransition(async () => {
      const result = await addBillAction(formData)
      if (result?.error) {
        setFormError(result.error)
      } else {
        setShowForm(false)
      }
    })
  }

  function handlePaid(shareId: string) {
    startTransition(() => markSharePaidAction(shareId))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Bill'}
        </button>
      </div>

      {showForm && (
        <form action={handleAdd} className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-stone-900 mb-4">New bill</h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {formError}
            </div>
          )}
          <input type="hidden" name="householdId" value={householdId} />
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Bill name</label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. Electricity"
                list="bill-suggestions"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              <datalist id="bill-suggestions">
                {['Rent','Electricity','Gas','Water / Sewer','Internet / WiFi','Renters Insurance','Groceries','Cleaning Supplies'].map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Total amount ($)</label>
              <input
                name="amount"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Due date</label>
              <input
                name="dueDate"
                type="date"
                required
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {isPending ? 'Adding...' : 'Add bill'}
            </button>
          </div>
        </form>
      )}

      {bills.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          No bills yet. Add one above.
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => {
            const myShare = bill.shares?.find((s) => s.user_id === currentUserId)
            const allPaid = bill.shares?.every((s) => s.paid_status)

            return (
              <div key={bill.id} className="bg-white border border-stone-200 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-stone-900">{bill.title}</p>
                    <p className="text-stone-500 text-sm mt-0.5">
                      {formatCents(bill.amount_cents)} total · Due {bill.due_date}
                      {bill.amount_cents === 0 && (
                        <span className="ml-2 text-amber-500 font-medium">· Needs amount</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    allPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {allPaid ? 'All paid' : 'Unpaid'}
                  </span>
                </div>

                <div className="space-y-2">
                  {bill.shares?.map((share) => {
                    const isMe = share.user_id === currentUserId
                    const name = share.profile?.name ?? share.profile?.email ?? 'Roommate'

                    return (
                      <div key={share.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${share.paid_status ? 'bg-emerald-400' : 'bg-stone-300'}`} />
                          <span className="text-sm text-stone-700">
                            {isMe ? 'You' : name} — {formatCents(share.amount_cents)}
                          </span>
                        </div>
                        {isMe && !share.paid_status && (
                          <button
                            onClick={() => handlePaid(share.id)}
                            disabled={isPending}
                            className="text-xs px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        )}
                        {share.paid_status && (
                          <span className="text-xs text-emerald-600">Paid</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
