'use client'

import { useState } from 'react'

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
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-semibold text-stone-900">Plan</h2>
          <span className="text-xs font-medium px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
            Upgrading…
          </span>
        </div>
        <p className="text-stone-500 text-sm mb-4">
          Your payment was received. Refresh in a moment to see your Premium status.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
    )
  }

  if (planTier === 'premium') {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-stone-900">Plan</h2>
              <span className="text-xs font-medium px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                Premium
              </span>
            </div>
            <p className="text-stone-500 text-sm">Unlimited roommates, chores, and bills.</p>
          </div>
          {isOwner && hasStripeCustomer && (
            <button
              onClick={handleManage}
              disabled={loading === 'portal'}
              className="text-sm text-stone-500 hover:text-stone-800 underline transition-colors disabled:opacity-50"
            >
              {loading === 'portal' ? 'Opening...' : 'Manage billing'}
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-semibold text-stone-900">Plan</h2>
        <span className="text-xs font-medium px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full">
          Free
        </span>
      </div>
      <p className="text-stone-500 text-sm mb-4">
        Free plan: up to 3 roommates, 10 chores, 3 bills.
      </p>

      {isOwner ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleUpgrade(monthlyPriceId, 'monthly')}
            disabled={!!loading}
            className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {loading === 'monthly' ? 'Redirecting...' : 'Upgrade — $7.99/mo'}
          </button>
          <button
            onClick={() => handleUpgrade(yearlyPriceId, 'yearly')}
            disabled={!!loading}
            className="flex-1 py-2 px-4 bg-white hover:bg-stone-50 disabled:opacity-50 border border-stone-200 text-stone-700 font-medium rounded-lg transition-colors text-sm"
          >
            {loading === 'yearly' ? 'Redirecting...' : 'Upgrade — $59.99/yr'}
          </button>
        </div>
      ) : (
        <p className="text-stone-400 text-sm">Only the household owner can upgrade.</p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
