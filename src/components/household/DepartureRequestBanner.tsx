'use client'

import { useTransition } from 'react'
import { LogOut, CheckCircle, Clock } from 'lucide-react'
import { acknowledgeLeaveAction } from '@/app/(dashboard)/dashboard/actions'
import type { DepartureRequest } from '@/types'

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

interface Props {
  departureRequest: DepartureRequest
  currentUserId: string
  memberCount: number
}

export default function DepartureRequestBanner({ departureRequest, currentUserId, memberCount }: Props) {
  const [isPending, startTransition] = useTransition()

  const name =
    departureRequest.profile?.name ??
    departureRequest.profile?.email?.split('@')[0] ??
    'A member'

  const acks = departureRequest.acknowledgements ?? []
  const alreadyAcknowledged = acks.some((a) => a.member_user_id === currentUserId)
  const remaining = memberCount - 1
  const ackedCount = acks.length
  const hasBills = (departureRequest.bill_payments ?? []).length > 0

  function handleAcknowledge() {
    startTransition(async () => {
      await acknowledgeLeaveAction(departureRequest.id)
    })
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <LogOut size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-stone-900">
            {name} has requested to leave the household.
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            {ackedCount} of {remaining} member{remaining !== 1 ? 's' : ''} acknowledged —
            departure completes when all remaining members acknowledge.
          </p>
        </div>
      </div>

      {hasBills && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">
            Unpaid bills — amounts {name} says they have paid:
          </p>
          {departureRequest.bill_payments!.map((bp) => (
            <div
              key={bp.id}
              className="flex justify-between items-center bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm"
            >
              <span className="text-stone-900">{bp.bill?.title ?? 'Bill'}</span>
              <span className="text-stone-500 text-xs">
                Bill total: {formatCents(bp.bill?.amount_cents ?? 0)} —{' '}
                {bp.amount_paid_cents > 0
                  ? `${name} paid ${formatCents(bp.amount_paid_cents)}`
                  : `${name} has not paid anything yet`}
              </span>
            </div>
          ))}
          {hasBills && (
            <p className="text-xs text-stone-500">
              After all members acknowledge, the remaining balances will be recalculated and split equally.
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        {acks.map((a) => (
          <div key={a.id} className="flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle size={12} />
            <span>Member acknowledged</span>
          </div>
        ))}
      </div>

      {alreadyAcknowledged ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle size={16} />
          <span>You have acknowledged this departure.</span>
        </div>
      ) : (
        <button
          onClick={handleAcknowledge}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Clock size={14} />
          ) : (
            <CheckCircle size={14} />
          )}
          {isPending ? 'Saving...' : 'I acknowledge this departure'}
        </button>
      )}
    </div>
  )
}
