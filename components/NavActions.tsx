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

  const [isAnonymous, setIsAnonymous] = useState(false)

  useEffect(() => {
    let isMounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      // Show email if available, otherwise show "Guest" for anonymous users
      const email = data.session?.user?.email ?? null
      const hasSession = !!data.session
      const anonymous = hasSession && !email
      setIsAnonymous(anonymous)
      setSessionEmail(email || (hasSession ? 'Guest' : null))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Show email if available, otherwise show "Guest" for anonymous users
      const email = session?.user?.email ?? null
      const hasSession = !!session
      const anonymous = hasSession && !email
      setIsAnonymous(anonymous)
      setSessionEmail(email || (hasSession ? 'Guest' : null))
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

    // If anonymous user, delete all their scoreboards before signing out
    if (isAnonymous) {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id

      if (userId) {
        const { error: deleteError } = await supabase
          .from('scoreboards')
          .delete()
          .eq('owner_id', userId)

        if (deleteError) {
          setError(deleteError.message)
          setLoading(false)
          return
        }
      }
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      setError(error.message || 'An error occurred')
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
        className="text-sm font-semibold text-black transition-colors hover:text-zinc-700"
      >
        Sign up/Sign in
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
        className="flex items-center rounded-full border border-black/10 bg-white/80 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-base font-semibold text-black shadow-sm shadow-black/5 transition-transform duration-150 hover:-translate-y-0.5 hover:text-zinc-700 active:scale-95"
      >
        <span className="max-w-[100px] sm:max-w-[180px] truncate">{sessionEmail}</span>
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-black/10 bg-white/90 py-2 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur animate-rise">
          {isAnonymous ? (
            <>
              <div className="px-3 py-2 border-b border-black/5">
                <p className="text-xs font-semibold text-zinc-600 mb-1">Guest Account</p>
                <p className="text-xs text-zinc-500">
                  Sign in to save your scoreboards permanently
                </p>
              </div>
              <Link
                href="/auth?convert=true"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 transition-colors duration-150 hover:bg-blue-50/80"
              >
                <span>💾</span>
                Save your scoreboards
              </Link>
            </>
          ) : (
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-black transition-colors duration-150 hover:bg-zinc-100/80"
            >
              Account
            </Link>
          )}
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
