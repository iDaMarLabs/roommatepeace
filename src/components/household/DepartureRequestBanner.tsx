'use client'

import { useState, useTransition } from 'react'
import { LogOut, CheckCircle, Clock, Circle, AlertTriangle } from 'lucide-react'
import { acknowledgeLeaveAction, forceLeaveAction } from '@/app/(dashboard)/dashboard/actions'
import type { DepartureRequest, HouseholdMember } from '@/types'
import { Button } from '@/components/ui/Button'

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

interface Props {
  departureRequest: DepartureRequest
  currentUserId: string
  memberCount: number
  isOwner: boolean
  members: HouseholdMember[]
}

export default function DepartureRequestBanner({ departureRequest, currentUserId, memberCount, isOwner, members }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isForcing, startForceTransition] = useTransition()
  const [forceError, setForceError] = useState<string | null>(null)
  const [confirmOverride, setConfirmOverride] = useState(false)

  const name =
    departureRequest.profile?.name ??
    departureRequest.profile?.email?.split('@')[0] ??
    'A member'

  const acks = departureRequest.acknowledgements ?? []
  const alreadyAcknowledged = acks.some((a) => a.member_user_id === currentUserId)
  const ackedUserIds = new Set(acks.map((a) => a.member_user_id))
  const remaining = memberCount - 1
  const ackedCount = acks.length
  const hasBills = (departureRequest.bill_payments ?? []).length > 0
  const allAcknowledged = ackedCount >= remaining
  const unacknowledgedCount = remaining - ackedCount

  function handleAcknowledge() {
    startTransition(async () => {
      await acknowledgeLeaveAction(departureRequest.id)
    })
  }

  function handleForceComplete() {
    startForceTransition(async () => {
      const result = await forceLeaveAction(departureRequest.id)
      if (result?.error) setForceError(result.error)
    })
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 space-y-4">
      <div className="flex items-start gap-3">
        <LogOut size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-stone-900">
            {isOwner
              ? `Action required: ${name} has requested to leave the household.`
              : `${name} has requested to leave the household.`}
          </p>
          <p className="text-xs text-stone-600 mt-0.5">
            {isOwner
              ? `Departure finalizes once all remaining members acknowledge. You can also override and finalize immediately.`
              : `Departure completes when all remaining members acknowledge.`}
          </p>
        </div>
      </div>

      {/* Acknowledgement progress */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">
          Acknowledgements — {ackedCount} of {remaining}
        </p>
        {members.map((m) => {
          const memberName =
            m.profile?.name ??
            m.profile?.email?.split('@')[0] ??
            'Member'
          const parts = memberName.trim().split(/\s+/)
          const displayName = parts.length === 1 ? memberName : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
          const hasAcked = ackedUserIds.has(m.user_id)
          const isYou = m.user_id === currentUserId
          return (
            <div key={m.user_id} className="flex items-center gap-2 text-sm">
              {hasAcked
                ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                : <Circle size={14} className="text-stone-300 shrink-0" />}
              <span className={hasAcked ? 'text-stone-700' : 'text-stone-400'}>
                {displayName}{isYou ? ' (you)' : ''}{m.role === 'owner' ? ' — owner' : ''}
              </span>
              {!hasAcked && (
                <span className="text-xs text-stone-400">waiting</span>
              )}
            </div>
          )
        })}
      </div>

      {hasBills && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">
            Unpaid bills — amounts {name} says they have paid:
          </p>
          {departureRequest.bill_payments!.map((bp) => (
            <div
              key={bp.id}
              className="flex justify-between items-center bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm"
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
          <p className="text-xs text-stone-500">
            After all members acknowledge, remaining balances will be recalculated and split equally.
          </p>
        </div>
      )}

      {allAcknowledged ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle size={16} />
          <span>All members have acknowledged. Departure is being finalized.</span>
        </div>
      ) : alreadyAcknowledged ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle size={16} />
          <span>You have acknowledged. Waiting on {unacknowledgedCount} other member{unacknowledgedCount !== 1 ? 's' : ''}.</span>
        </div>
      ) : (
        <Button
          variant="primary"
          onClick={handleAcknowledge}
          disabled={isPending}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <span className="flex items-center gap-2">
            {isPending ? <Clock size={14} /> : <CheckCircle size={14} />}
            {isPending ? 'Saving...' : isOwner ? 'Approve departure' : 'I acknowledge this departure'}
          </span>
        </Button>
      )}

      {/* Owner override */}
      {isOwner && !allAcknowledged && unacknowledgedCount > 0 && (
        <div className="border-t border-amber-200 pt-4 space-y-2">
          {!confirmOverride ? (
            <button
              onClick={() => setConfirmOverride(true)}
              className="text-xs text-stone-500 hover:text-red-600 underline"
            >
              Override — finalize departure without waiting for all members
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">
                  This will immediately remove {name} from the household and finalize their bill settlements, bypassing the {unacknowledgedCount} unacknowledged member{unacknowledgedCount !== 1 ? 's' : ''}. This cannot be undone.
                </p>
              </div>
              {forceError && (
                <p className="text-xs text-red-600">{forceError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleForceComplete}
                  disabled={isForcing}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isForcing ? 'Finalizing...' : 'Yes, finalize now'}
                </button>
                <button
                  onClick={() => setConfirmOverride(false)}
                  disabled={isForcing}
                  className="px-3 py-1.5 bg-stone-100 text-stone-600 text-xs font-medium rounded-lg hover:bg-stone-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
