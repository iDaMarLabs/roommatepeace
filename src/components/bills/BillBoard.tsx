'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Receipt, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { addBillAction, editBillAction, markSharePaidAction, deleteBillAction } from '@/app/(dashboard)/bills/actions'
import type { BillWithShares } from '@/services/bill.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props {
  householdId: string
  currentUserId: string
  bills: BillWithShares[]
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function BillBoard({ householdId, currentUserId, bills }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingBillId, setEditingBillId] = useState<string | null>(null)
  const [editError, setEditError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [payingShareId, setPayingShareId] = useState<string | null>(null)
  const [paymentNote, setPaymentNote] = useState('')
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

  function handlePaid(shareId: string, note: string) {
    startTransition(async () => {
      await markSharePaidAction(shareId, note)
      setPayingShareId(null)
      setPaymentNote('')
    })
  }

  function handleDelete(billId: string) {
    setDeleteError('')
    startTransition(async () => {
      const result = await deleteBillAction(billId)
      if (result?.error) {
        setDeleteError(result.error)
        setConfirmDeleteId(billId)
      } else {
        setConfirmDeleteId(null)
      }
    })
  }

  function handleEdit(formData: FormData) {
    setEditError('')
    startTransition(async () => {
      const result = await editBillAction(formData)
      if (result?.error) {
        setEditError(result.error)
      } else {
        setEditingBillId(null)
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : '+ Add Bill'}
        </Button>
      </div>

      {showForm && (
        <form action={handleAdd} className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-4">New bill</h2>
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
            <div>
              <Input
                label="Bill name"
                name="title"
                type="text"
                required
                placeholder="e.g. Electricity"
                list="bill-suggestions"
              />
              <datalist id="bill-suggestions">
                {['Rent', 'Electricity', 'Gas', 'Water / Sewer', 'Internet / WiFi', 'Renters Insurance', 'Groceries', 'Cleaning Supplies'].map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <Input
              label="Total amount ($)"
              name="amount"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            <Input
              label="Due date"
              name="dueDate"
              type="date"
              required
            />
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="recurringCheck"
                id="recurringCheck"
                onChange={(e) => {
                  const hidden = e.currentTarget.form?.elements.namedItem('recurring') as HTMLInputElement | null
                  if (hidden) hidden.value = e.currentTarget.checked ? 'true' : 'false'
                }}
                className="w-4 h-4 rounded border-stone-300 text-emerald-500 focus:ring-emerald-500"
              />
              <input type="hidden" name="recurring" defaultValue="false" />
              <span className="text-sm text-stone-700">Repeats monthly</span>
            </label>
            <Button type="submit" fullWidth disabled={isPending}>
              {isPending ? 'Adding...' : 'Add bill'}
            </Button>
          </div>
        </form>
      )}

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
            <Receipt size={22} className="text-stone-400" />
          </div>
          <p className="text-stone-500 text-sm">No bills yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => {
            const myShare = bill.shares?.find((s) => s.user_id === currentUserId)
            const allPaid = bill.shares?.every((s) => s.paid_status)
            const needsAmount = bill.amount_cents === 0

            return (
              <div key={bill.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                {editingBillId === bill.id ? (
                  <form action={handleEdit}>
                    <input type="hidden" name="billId" value={bill.id} />
                    <h3 className="font-semibold text-stone-900 mb-4">Edit bill</h3>
                    {editError && (
                      <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {editError}
                      </div>
                    )}
                    <div className="space-y-4">
                      <Input
                        label="Bill name"
                        name="title"
                        type="text"
                        required
                        defaultValue={bill.title}
                      />
                      <Input
                        label="Total amount ($)"
                        name="amount"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        defaultValue={(bill.amount_cents / 100).toFixed(2)}
                      />
                      <Input
                        label="Due date"
                        name="dueDate"
                        type="date"
                        required
                        defaultValue={bill.due_date}
                      />
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={bill.recurring}
                          onChange={(e) => {
                            const hidden = e.currentTarget.form?.elements.namedItem('recurring') as HTMLInputElement | null
                            if (hidden) hidden.value = e.currentTarget.checked ? 'true' : 'false'
                          }}
                          className="w-4 h-4 rounded border-stone-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <input type="hidden" name="recurring" defaultValue={bill.recurring ? 'true' : 'false'} />
                        <span className="text-sm text-stone-700">Repeats monthly</span>
                      </label>
                      <div className="flex gap-2 pt-1">
                        <Button type="submit" fullWidth disabled={isPending}>
                          {isPending ? 'Saving...' : 'Save changes'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          fullWidth
                          onClick={() => { setEditingBillId(null); setEditError('') }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Bill header */}
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-base font-semibold text-stone-900 leading-tight">
                        {bill.title}
                      </p>
                      <div className="flex items-center gap-0.5 ml-3 shrink-0">
                        <button
                          onClick={() => { setEditingBillId(bill.id); setEditError(''); setConfirmDeleteId(null) }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                          aria-label="Edit bill"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setConfirmDeleteId(bill.id); setDeleteError(''); setEditingBillId(null) }}
                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete bill"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Amount + badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-2xl font-bold text-stone-900 tracking-tight">
                        {formatCents(bill.amount_cents)}
                      </span>
                      {bill.recurring && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          <RefreshCw size={10} />
                          Monthly
                        </span>
                      )}
                      {needsAmount && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                          Needs amount
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        allPaid
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {allPaid ? 'All paid' : 'Unpaid'}
                      </span>
                    </div>

                    {/* Due date */}
                    <p className="text-sm text-stone-500 mb-5">
                      Due {formatDate(bill.due_date)}
                    </p>

                    {/* Delete confirmation */}
                    {confirmDeleteId === bill.id && (
                      <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                        <p className="text-sm text-red-700 font-medium">
                          Delete this bill? This cannot be undone.
                        </p>
                        {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(bill.id)}
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

                    {/* Share rows */}
                    <div className="border-t border-stone-100 pt-4 space-y-3">
                      {bill.shares?.map((share) => {
                        const isMe = share.user_id === currentUserId
                        const name = share.profile?.name ?? share.profile?.email ?? 'Roommate'
                        const isPayingThis = payingShareId === share.id

                        return (
                          <div key={share.id}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${share.paid_status ? 'bg-emerald-400' : 'bg-stone-300'}`} />
                                <span className="text-sm text-stone-700">
                                  {isMe ? 'You' : name}
                                  <span className="text-stone-400 mx-1">·</span>
                                  {formatCents(share.amount_cents)}
                                </span>
                              </div>
                              {isMe && !share.paid_status && !isPayingThis && (
                                <button
                                  onClick={() => { setPayingShareId(share.id); setPaymentNote('') }}
                                  disabled={isPending}
                                  className="text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Mark Paid
                                </button>
                              )}
                              {share.paid_status && (
                                <span className="text-xs font-medium text-emerald-600">
                                  Paid
                                  {share.payment_note && (
                                    <span className="text-stone-400 font-normal ml-1">· {share.payment_note}</span>
                                  )}
                                </span>
                              )}
                            </div>

                            {isPayingThis && (
                              <div className="mt-2 pt-3 border-t border-stone-100 space-y-3">
                                <Input
                                  label="How did you pay?"
                                  type="text"
                                  placeholder="e.g. Sent via Venmo @username"
                                  value={paymentNote}
                                  onChange={(e) => setPaymentNote(e.target.value)}
                                />
                                <Button
                                  variant="primary"
                                  fullWidth
                                  disabled={isPending || !paymentNote.trim()}
                                  onClick={() => handlePaid(share.id, paymentNote.trim())}
                                >
                                  {isPending ? 'Saving...' : 'Confirm Payment'}
                                </Button>
                                <button
                                  onClick={() => { setPayingShareId(null); setPaymentNote('') }}
                                  className="block w-full text-center text-xs text-stone-400 hover:text-stone-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
