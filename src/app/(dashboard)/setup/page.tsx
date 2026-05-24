'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/households', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <h1 className="text-xl font-semibold text-stone-900 mb-1">
          Create your household
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          Give your home a name your roommates will recognize.
        </p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Household name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. 3rd Ave Apartment"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {loading ? 'Creating...' : 'Create household'}
          </button>
        </div>
      </div>
    </div>
  )
}
