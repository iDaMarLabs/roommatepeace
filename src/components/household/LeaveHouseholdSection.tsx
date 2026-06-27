'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { requestLeaveAction, cancelLeaveAction } from '@/app/(dashboard)/settings/actions'
import type { DepartureRequest } from '@/types'

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

interface UnpaidBill {
  id: string
  title: string
  amount_cents: number
  myShareCents: number
}

interface Props {
  householdId: string
  isOwner: boolean
  memberCount: number
  unpaidBills: UnpaidBill[]
  existingRequest: DepartureRequest | null
  currentUserId: string
}

export default function LeaveHouseholdSection({
  householdId,
  isOwner,
  memberCount,
  unpaidBills,
  existingRequest,
  currentUserId,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<Record<string, string>>(
    Object.fromEntries(unpaidBills.map((b) => [b.id, '0']))
  )
  const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>(
    Object.fromEntries(unpaidBills.map((b) => [b.id, '']))
  )
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (isOwner && memberCount > 1) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-amber-800">
          You are the household owner. Transfer ownership to another member before leaving.
        </p>
        <p className="text-xs text-amber-600 mt-1">
          Ownership transfer will be available in a future update.
        </p>
      </div>
    )
  }

  if (existingRequest) {
    const acks = existingRequest.acknowledgements ?? []
    const remaining = memberCount - 1
    const ackedCount = acks.length
    const allAcknowledged = ackedCount >= remaining

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Clock size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-stone-900">Leave request submitted</p>
            <p className="text-sm text-stone-600 mt-1">
              {allAcknowledged
                ? 'All members have acknowledged. Your departure is being finalized.'
                : `You will be removed from the household once all remaining members acknowledge your departure. ${ackedCount} of ${remaining} member${remaining !== 1 ? 's' : ''} have acknowledged so far.`}
            </p>
            <p className="text-xs text-stone-500 mt-2">
              Other members will see a banner on their dashboard asking them to acknowledge. You can cancel this request at any time before all members have acknowledged.
            </p>
          </div>
        </div>

        {existingRequest.bill_payments && existingRequest.bill_payments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">Bills you reported paying</p>
            {existingRequest.bill_payments.map((bp) => (
              <div key={bp.id} className="text-sm text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-2 space-y-0.5">
                <div className="flex justify-between">
                  <span>{bp.bill?.title ?? 'Bill'}</span>
                  <span className="text-stone-500">
                    {bp.amount_paid_cents > 0
                      ? `${formatCents(bp.amount_paid_cents)} paid of ${formatCents(bp.bill?.amount_cents ?? 0)}`
                      : 'Nothing paid yet'}
                  </span>
                </div>
                {bp.payment_note && (
                  <p className="text-xs text-stone-400">Paid via: {bp.payment_note}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {ackedCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle size={13} />
            <span>{ackedCount} member{ackedCount !== 1 ? 's have' : ' has'} acknowledged</span>
          </div>
        )}

        <button
          onClick={() => {
            startTransition(async () => {
              await cancelLeaveAction(existingRequest.id)
            })
          }}
          disabled={isPending || allAcknowledged}
          className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50"
        >
          Cancel leave request
        </button>
      </div>
    )
  }

  function handlePaymentChange(billId: string, value: string) {
    setPayments((prev) => ({ ...prev, [billId]: value }))
  }

  function handleSubmit() {
    setError(null)

    const billPayments = unpaidBills.map((bill) => {
      const dollars = parseFloat(payments[bill.id] ?? '0') || 0
      const cents = Math.round(dollars * 100)
      if (cents > bill.amount_cents) {
        setError(`Amount paid for "${bill.title}" cannot exceed the bill total.`)
        return null
      }
      return { billId: bill.id, amountPaidCents: cents, paymentNote: paymentNotes[bill.id] || undefined }
    })

    if (billPayments.some((p) => p === null)) return

    startTransition(async () => {
      const result = await requestLeaveAction(
        householdId,
        billPayments as { billId: string; amountPaidCents: number }[]
      )
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Leave this household
        </button>
      ) : (
        <div className="bg-white border border-red-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-stone-900">
                {isOwner && memberCount === 1
                  ? 'This will permanently delete the household.'
                  : 'Are you sure you want to leave?'}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">This cannot be undone.</p>
            </div>
          </div>

          {unpaidBills.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-stone-700">
                You have unpaid bills. Enter any amounts you have already paid toward each:
              </p>
              {unpaidBills.map((bill) => (
                <div key={bill.id} className="bg-stone-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-stone-900">{bill.title}</span>
                    <span className="text-stone-500">
                      Bill total: {formatCents(bill.amount_cents)} — Your share: {formatCents(bill.myShareCents)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-500">Amount you have paid: $</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={(bill.amount_cents / 100).toFixed(2)}
                      value={payments[bill.id] ?? '0'}
                      onChange={(e) => handlePaymentChange(bill.id, e.target.value)}
                      className="w-28 rounded-lg border border-stone-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="How did you pay? (e.g. Venmo, cash, Zelle)"
                      value={paymentNotes[bill.id] ?? ''}
                      onChange={(e) => setPaymentNotes((prev) => ({ ...prev, [bill.id]: e.target.value }))}
                      className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-stone-500">
                The remaining balance will be recalculated and split among remaining members after all members acknowledge.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isPending
                ? 'Processing...'
                : unpaidBills.length > 0
                ? 'Request to Leave'
                : 'Confirm Leave'}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setError(null) }}
              disabled={isPending}
              className="px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
