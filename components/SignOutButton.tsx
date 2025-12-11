'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.replace('/')
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-black shadow-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
      >
        {loading ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <p className="text-sm text-red-500 dark:text-red-300">Error: {error}</p>}
    </div>
  )
}
