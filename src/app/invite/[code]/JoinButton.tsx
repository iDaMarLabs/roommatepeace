'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinHouseholdAction } from './actions'

interface Props {
  inviteCode: string
}

export default function JoinButton({ inviteCode }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    setLoading(true)
    setError('')
    const result = await joinHouseholdAction(inviteCode)
    if (result.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError(result.error ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-medium rounded-lg transition-colors text-sm"
      >
        {loading ? 'Joining...' : 'Join household'}
      </button>
    </div>
  )
}
