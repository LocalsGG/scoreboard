'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Mode = 'signin' | 'signup'
type View = 'form' | 'reset'

interface Status {
  type: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

export function AuthForm() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState<Mode>('signin')
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [view, setView] = useState<View>('form')
  const [resetStatus, setResetStatus] = useState<Status>({ type: 'idle' })
  const heroTitle =
    view === 'reset' ? 'Reset password' : mode === 'signin' ? 'Welcome back' : "Let's get started"
  const heroSubtitle =
    view === 'reset'
      ? 'Send a reset link to your email and follow the instructions.'
      : 'Sign in with your email and password. Switch modes or reset below.'

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setUserEmail(data.session?.user?.email ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (userEmail) {
      router.replace('/dashboard')
    }
  }, [userEmail, router])

  async function handleSubmit() {
    if (view !== 'form') return
    setStatus({ type: 'loading' })
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : undefined

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setStatus({ type: 'error', message: 'Passwords do not match.' })
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      })

      if (error) {
        setStatus({ type: 'error', message: error.message })
        return
      }
      setStatus({ type: 'success', message: 'Check your email to confirm.' })
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }

    setStatus({ type: 'success', message: 'Signed in.' })
    router.push('/dashboard')
  }

  async function handleReset() {
    if (view !== 'reset') return
    if (!email) {
      setResetStatus({ type: 'error', message: 'Enter an email first.' })
      return
    }
    setResetStatus({ type: 'loading' })
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/update-password`
        : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      setResetStatus({ type: 'error', message: error.message })
      return
    }

    setResetStatus({
      type: 'success',
      message: 'Password reset email sent. Check your inbox.',
    })
  }

  const cta = mode === 'signin' ? 'Sign in' : 'Sign up'
  const toggleCopy =
    mode === 'signin' ? "Don't have an account?" : 'Already have an account?'
  const toggleAction = mode === 'signin' ? 'Create one' : 'Sign in'

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-black dark:text-white">{heroTitle}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{heroSubtitle}</p>
      </div>

      {view === 'form' ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
            <input
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete={mode === 'signin' ? 'email' : 'new-email'}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
            <input
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {mode === 'signup' ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Confirm password
              </label>
              <input
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setStatus({ type: 'idle' })
              }}
              className="text-black underline-offset-4 hover:underline dark:text-white"
            >
              {toggleCopy} {toggleAction}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('reset')
                setResetStatus({ type: 'idle' })
              }}
              className="text-black underline-offset-4 hover:underline dark:text-white"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={status.type === 'loading'}
            className="flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {status.type === 'loading' ? 'Working...' : cta}
          </button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void handleReset()
          }}
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
            <input
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setView('form')
                setResetStatus({ type: 'idle' })
              }}
              className="text-black underline-offset-4 hover:underline dark:text-white"
            >
              Back to sign in
            </button>
            <button
              type="submit"
              disabled={resetStatus.type === 'loading'}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {resetStatus.type === 'loading' ? 'Sending...' : 'Send reset email'}
            </button>
          </div>
        </form>
      )}

      {view === 'form' && status.type !== 'idle' && status.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-200'
              : status.type === 'error'
              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200'
              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200'
          }`}
        >
          {status.message}
        </div>
      )}

      {view === 'reset' && resetStatus.type !== 'idle' && resetStatus.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            resetStatus.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-200'
              : resetStatus.type === 'error'
              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200'
              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200'
          }`}
        >
          {resetStatus.message}
        </div>
      )}
    </div>
  )
}
