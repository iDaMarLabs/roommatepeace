'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-4">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-stone-900 mb-2">Check your email</h2>
        <p className="text-stone-600 text-sm mb-6">
          We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link to set a new password.
        </p>
        <Link href="/login" className="text-emerald-600 hover:underline text-sm font-medium">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <h2 className="text-xl font-semibold text-stone-900 mb-1">Reset your password</h2>
      <p className="text-stone-600 text-sm mb-6">
        Enter your email and we'll send you a link to set a new password.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
        />

        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </div>

      <p className="text-center text-stone-600 text-sm mt-6">
        <Link href="/login" className="text-emerald-600 hover:underline font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
