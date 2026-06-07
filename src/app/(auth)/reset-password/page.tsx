'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit() {
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <h2 className="text-xl font-semibold text-stone-900 mb-1">Set a new password</h2>
      <p className="text-stone-600 text-sm mb-6">Choose a new password for your account.</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={loading || !password || !confirm}
        >
          {loading ? 'Updating...' : 'Update password'}
        </Button>
      </div>
    </div>
  )
}
