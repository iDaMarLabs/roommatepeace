'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  planTier: string
  isOwner: boolean
  hasStripeCustomer: boolean
  monthlyPriceId: string
  yearlyPriceId: string
  upgradePending?: boolean
}

export default function PlanSection({
  planTier,
  isOwner,
  hasStripeCustomer,
  monthlyPriceId,
  yearlyPriceId,
  upgradePending = false,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleUpgrade(priceId: string, label: string) {
    setLoading(label)
    setError('')
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(null)
      return
    }
    window.location.href = data.url
  }

  async function handleManage() {
    setLoading('portal')
    setError('')
    const res = await fetch('/api/customer-portal', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(null)
      return
    }
    window.location.href = data.url
  }

  if (upgradePending) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-semibold text-stone-900">Plan</h2>
          <span className="text-xs font-medium px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
            Upgrading…
          </span>
        </div>
        <p className="text-stone-600 text-sm mb-4">
          Your payment was received. Refresh in a moment to see your Premium status.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    )
  }

  if (planTier === 'premium') {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-stone-900">Plan</h2>
              <span className="text-xs font-medium px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                Premium
              </span>
            </div>
            <p className="text-stone-600 text-sm">Unlimited roommates, chores, and bills.</p>
          </div>
          {isOwner && hasStripeCustomer && (
            <Button
              variant="ghost"
              onClick={handleManage}
              disabled={loading === 'portal'}
            >
              {loading === 'portal' ? 'Opening...' : 'Manage billing'}
            </Button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-semibold text-stone-900">Plan</h2>
        <span className="text-xs font-medium px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full">
          Free
        </span>
      </div>
      <p className="text-stone-600 text-sm mb-4">
        Free Plan for a Limited Time: up to 2 roommates, 3 bills, 3 chores, 3 rules.
      </p>

      {isOwner ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleUpgrade(monthlyPriceId, 'monthly')}
            disabled={!!loading}
          >
            {loading === 'monthly' ? 'Redirecting...' : 'Upgrade — $7.99/mo'}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => handleUpgrade(yearlyPriceId, 'yearly')}
            disabled={!!loading}
          >
            {loading === 'yearly' ? 'Redirecting...' : 'Upgrade — $59.99/yr'}
          </Button>
        </div>
      ) : (
        <p className="text-stone-400 text-sm">Only the household owner can upgrade.</p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
