'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavActionsProps {
  email: string | null
}

export function NavActions({ email }: NavActionsProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [sessionEmail, setSessionEmail] = useState<string | null>(email)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSessionEmail(data.session?.user?.email ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null)
      router.refresh()
    })
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  async function handleSignOut() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSessionEmail(null)
    setLoading(false)
    setMenuOpen(false)
    router.replace('/')
  }

  if (!sessionEmail) {
    return (
      <Link
        href="/auth"
        className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-black via-black to-zinc-800 px-4 py-2 text-base font-semibold text-white shadow-lg shadow-black/15 transition-transform duration-150 hover:-translate-y-0.5 active:scale-95"
      >
        Sign up / Sign in
      </Link>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="flex items-center rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-base font-semibold text-black shadow-sm shadow-black/5 transition-transform duration-150 hover:-translate-y-0.5 hover:text-zinc-700 active:scale-95"
      >
        <span className="max-w-[180px] truncate">{sessionEmail}</span>
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-black/10 bg-white/90 py-2 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur animate-rise">
          <Link
            href="/account"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-black transition-colors duration-150 hover:bg-zinc-100/80"
          >
            Account
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="flex w-full items-center px-3 py-2 text-left text-sm font-semibold text-black transition-colors duration-150 hover:bg-zinc-100/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing out…' : 'Log out'}
          </button>
          {error ? (
            <span className="block px-3 pt-1 text-xs font-medium text-red-600">
              {error}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
