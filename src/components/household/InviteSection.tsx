'use client'

import { useState, useTransition, useEffect } from 'react'
import { regenerateInviteCodeAction } from '@/app/(dashboard)/dashboard/actions'
import QRCodeDisplay from '@/components/ui/QRCodeDisplay'

interface Props {
  householdId: string
  inviteCode: string
  memberCount: number
  planTier: string
}

export default function InviteSection({ householdId, inviteCode, memberCount, planTier }: Props) {
  const [currentCode, setCurrentCode] = useState(inviteCode)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const inviteUrl = origin ? `${origin}/invite/${currentCode}` : `/invite/${currentCode}`

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleRegenerate() {
    startTransition(async () => {
      await regenerateInviteCodeAction(householdId)
      // The new code will come from the server on next render; for instant UI
      // feedback we generate a placeholder UUID client-side and let revalidation sync it
      setCurrentCode(crypto.randomUUID())
    })
  }

  const limit = planTier === 'free' ? 3 : null

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-stone-900">Invite Roommates</h2>
        {limit && (
          <span className="text-xs text-stone-400">
            {memberCount}/{limit} members
          </span>
        )}
      </div>
      <p className="text-stone-500 text-sm mb-4">
        Share this link with your roommates so they can join.
      </p>

      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 mb-4">
        <span className="flex-1 text-stone-600 text-sm truncate">{inviteUrl}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="flex justify-center mb-4">
        <QRCodeDisplay path={`/invite/${currentCode}`} size={160} />
      </div>

      <button
        onClick={handleRegenerate}
        disabled={isPending}
        className="text-xs text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Regenerating...' : 'Generate new link'}
      </button>
    </div>
  )
}
