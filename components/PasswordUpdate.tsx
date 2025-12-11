'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Status {
  type: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

export function PasswordUpdate() {
  const supabase = useMemo(() => createClient(), [])
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [sessionReady, setSessionReady] = useState(false)

  // Ensure we have a session (from the magic link) before allowing password change.
  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSessionReady(!!data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionReady(!!session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  async function handleUpdate() {
    if (!sessionReady) {
      setStatus({ type: 'error', message: 'Open this page from the reset link so you are authenticated.' })
      return
    }
    if (!password || password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' })
      return
    }

    setStatus({ type: 'loading' })
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }
    setStatus({ type: 'success', message: 'Password updated. You can now sign in with the new password.' })
    setPassword('')
  }

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-black dark:text-white">Set a new password</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Open this from the reset email so the session is active.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">New password</label>
        <input
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
      </div>

      <button
        type="button"
        onClick={handleUpdate}
        disabled={status.type === 'loading'}
        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Update password
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
