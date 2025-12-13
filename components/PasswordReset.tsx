'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Status {
  type: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

export function PasswordReset() {
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>({ type: 'idle' })

  async function handleReset() {
    if (!email) {
      setStatus({ type: 'error', message: 'Enter an email first.' })
      return
    }
    setStatus({ type: 'loading' })
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/update-password`
        : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }

    setStatus({
      type: 'success',
      message: 'Password reset email sent. Check your inbox.',
    })
  }

  return (
    <div id="reset" className="w-full max-w-xl space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-black dark:text-white">Reset password</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sends a reset link to your email. The link returns here: <code>/auth/update-password</code>.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
        <input
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <button
        type="button"
        onClick={handleReset}
        disabled={status.type === 'loading'}
        className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Send reset email
      </button>

      {status.type !== 'idle' && status.message && (
        <p
          className={`text-sm ${
            status.type === 'success'
              ? 'text-green-600 dark:text-green-300'
              : status.type === 'error'
              ? 'text-red-600 dark:text-red-300'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  )
}
