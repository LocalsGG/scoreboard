'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { AuthMode, AuthView, OAuthProvider, AuthStatus } from '@/lib/types'

type Mode = AuthMode
type View = AuthView
type Status = AuthStatus

interface AuthFormProps {
  isConverting?: boolean
  redirectTo?: string
  plan?: string
  isAnnual?: boolean
  finalRedirectTo?: string // The actual URL to redirect to after checkout (when redirectTo is 'pricing')
}

function getPricingCheckoutRedirectUrl(params: {
  plan: 'standard' | 'pro' | 'lifetime'
  isAnnual?: boolean
  finalRedirectTo?: string
}): string {
  const searchParams = new URLSearchParams({
    checkout: 'true',
    plan: params.plan,
  })
  if (params.plan !== 'lifetime' && params.isAnnual) {
    searchParams.set('isAnnual', 'true')
  }
  // Preserve the final redirect URL if provided
  if (params.finalRedirectTo) {
    searchParams.set('redirect', params.finalRedirectTo)
  }
  return `/pricing?${searchParams.toString()}`
}

export function AuthForm({ isConverting = false, redirectTo, plan, isAnnual, finalRedirectTo }: AuthFormProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState<Mode>('signin')
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [view, setView] = useState<View>('form')
  const [resetStatus, setResetStatus] = useState<Status>({ type: 'idle' })
  const [oauthStatus, setOauthStatus] = useState<Status>({ type: 'idle' })
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)
  const heroTitle = isConverting
    ? 'Convert to Account'
    : view === 'reset'
    ? 'Reset password'
    : mode === 'signin'
    ? 'Welcome back'
    : "Let's get started"
  const heroSubtitle = isConverting
    ? 'Sign in to save your scoreboards permanently. Your existing data will be preserved.'
    : view === 'reset'
    ? 'Send a reset link to your email and follow the instructions.'
    : ''

  useEffect(() => {
    let isMounted = true
    let hasRedirected = false
    
    void supabase.auth.getUser().then(({ data }) => {
      if (!isMounted || hasRedirected) return
      const hasUser = !!data.user
      const isAnonymous = hasUser && !data.user?.email
      
      // Only redirect if user has email (not anonymous) and not converting
      if (hasUser && !isAnonymous && !isConverting && data.user?.email) {
        hasRedirected = true
        if (redirectTo === 'pricing' && plan && (plan === 'standard' || plan === 'pro' || plan === 'lifetime')) {
          // Redirect back to pricing with plan info to trigger checkout
          router.replace(getPricingCheckoutRedirectUrl({ plan, isAnnual, finalRedirectTo }))
        } else if (redirectTo && redirectTo.startsWith('/')) {
          // If redirectTo is a URL path, redirect there
          router.replace(redirectTo)
        } else if (!redirectTo) {
          // Only redirect to dashboard if no redirectTo is specified
          router.replace('/dashboard')
        }
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted || hasRedirected) return
      const hasSession = !!session
      const isAnonymous = hasSession && !session?.user?.email
      
      // Only redirect if user has email (not anonymous) and not converting
      if (hasSession && !isAnonymous && !isConverting && session?.user?.email) {
        hasRedirected = true
        if (redirectTo === 'pricing' && plan && (plan === 'standard' || plan === 'pro' || plan === 'lifetime')) {
          // Redirect back to pricing to trigger checkout (single-source)
          router.replace(getPricingCheckoutRedirectUrl({ plan, isAnnual, finalRedirectTo }))
        } else if (redirectTo && redirectTo.startsWith('/')) {
          // If redirectTo is a URL path, redirect there
          router.replace(redirectTo)
        } else if (!redirectTo) {
          // Only redirect to dashboard if no redirectTo is specified
          router.replace('/dashboard')
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router, isConverting, redirectTo, plan, isAnnual, finalRedirectTo])

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
        setStatus({ type: 'error', message: error.message || 'An error occurred' })
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
      setStatus({ type: 'error', message: error.message || 'An error occurred' })
      return
    }

    setStatus({ type: 'success', message: 'Signed in.' })
    
    // If redirecting to checkout, redirect back to pricing (single-source)
    if (redirectTo === 'pricing' && plan && (plan === 'standard' || plan === 'pro' || plan === 'lifetime')) {
      router.replace(getPricingCheckoutRedirectUrl({ plan, isAnnual, finalRedirectTo }))
    } else {
      router.push('/dashboard')
    }
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
      setResetStatus({ type: 'error', message: error.message || 'An error occurred' })
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

  async function handleOAuth(provider: OAuthProvider) {
    setOauthStatus({ type: 'loading', message: 'Redirecting to Google...' })
    setOauthLoading(provider)

    const callbackUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
    
    // Build redirect params if we need to go to checkout
    let finalRedirect = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined
    if (redirectTo === 'pricing' && plan) {
      const params = new URLSearchParams({
        redirect: 'pricing',
        plan,
        ...(plan !== 'lifetime' && isAnnual && { isAnnual: 'true' }),
        ...(finalRedirectTo && { redirectTo: finalRedirectTo }),
      })
      finalRedirect = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?${params.toString()}` : undefined
    }

    const { error, data } = await supabase.auth.signInWithOAuth({
      provider,
      options: callbackUrl ? { 
        redirectTo: callbackUrl,
        queryParams: finalRedirect ? {
          next: finalRedirect,
        } : undefined,
      } : undefined,
    })

    if (error) {
      setOauthStatus({ type: 'error', message: error.message || 'An error occurred' })
      setOauthLoading(null)
      return
    }

    if (data?.url) {
      window.location.assign(data.url)
    } else {
      setOauthStatus({ type: 'success', message: 'Redirecting...' })
    }
  }


  const oauthProviders: Array<{
    id: OAuthProvider
    label: string
    icon: string
    className: string
    style?: CSSProperties
  }> = [
    {
      id: 'google',
      label: 'Continue with Google',
      icon: '/google.svg',
      className:
        'border border-black/10 bg-white text-black hover:bg-zinc-50',
    },
  ]

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black text-center">
          {heroTitle}
        </h1>
        {heroSubtitle ? <p className="text-xs sm:text-sm text-black px-2">{heroSubtitle}</p> : null}
        {isConverting && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 sm:px-4 py-2 sm:py-3 mt-3 text-left">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>Note:</strong> Your current scoreboards will be linked to your new account automatically.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {oauthProviders.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => {
              if (oauthLoading) return
              void handleOAuth(provider.id)
            }}
            disabled={Boolean(oauthLoading)}
            className={`flex w-full items-center justify-center gap-2 sm:gap-3 rounded-md px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${provider.className}`}
            style={provider.style}
          >
            <Image src={provider.icon} alt="" width={20} height={20} className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">{provider.label}</span>
          </button>
        ))}
        {oauthStatus.type !== 'idle' && oauthStatus.message && (
          <div
            className={`rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium ${
              oauthStatus.type === 'success'
                ? 'bg-green-50 text-green-700'
                : oauthStatus.type === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-zinc-100 text-black'
            }`}
          >
            {oauthStatus.message}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold uppercase text-black">
        <span className="h-px flex-1 bg-black" />
        <span className="whitespace-nowrap">Or email</span>
        <span className="h-px flex-1 bg-black" />
      </div>

      {view === 'form' ? (
        <form
          className="space-y-3 sm:space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium text-black">Email</label>
            <input
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 sm:py-2.5 text-sm text-black transition-all duration-150 placeholder:text-zinc-500 hover:-translate-y-0.5 hover:border-black/30 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] focus:outline-none active:scale-[0.99]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete={mode === 'signin' ? 'email' : 'new-email'}
              required
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium text-black">Password</label>
            <input
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 sm:py-2.5 text-sm text-black transition-all duration-150 placeholder:text-zinc-500 hover:-translate-y-0.5 hover:border-black/30 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] focus:outline-none active:scale-[0.99]"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {mode === 'signup' ? (
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-black">
                Confirm password
              </label>
              <input
                className="w-full rounded-md border border-black/10 bg-white px-3 py-2 sm:py-2.5 text-sm text-black transition-all duration-150 placeholder:text-zinc-500 hover:-translate-y-0.5 hover:border-black/30 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] focus:outline-none active:scale-[0.99]"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setStatus({ type: 'idle' })
              }}
              className="text-black underline-offset-4 transition-transform duration-150 hover:-translate-y-0.5 hover:underline active:scale-95 text-left sm:text-left"
            >
              {toggleCopy} {toggleAction}
            </button>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setView('reset')
                  setResetStatus({ type: 'idle' })
                }}
                className="text-black underline-offset-4 transition-transform duration-150 hover:-translate-y-0.5 hover:underline active:scale-95 text-left sm:text-right"
              >
                Forgot password?
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={status.type === 'loading'}
            className="flex w-full items-center justify-center rounded-md bg-black px-4 py-2.5 sm:py-2.5 text-sm font-semibold text-white shadow transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 mt-2 sm:mt-0"
          >
            {status.type === 'loading' ? 'Working...' : cta}
          </button>
        </form>
      ) : (
        <form
          className="space-y-3 sm:space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void handleReset()
          }}
        >
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium text-black">Email</label>
            <input
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 sm:py-2.5 text-sm text-black transition-all duration-150 placeholder:text-zinc-500 hover:-translate-y-0.5 hover:border-black/30 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] focus:outline-none active:scale-[0.99]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setView('form')
                setResetStatus({ type: 'idle' })
              }}
              className="text-black underline-offset-4 transition-transform duration-150 hover:-translate-y-0.5 hover:underline active:scale-95 text-left sm:text-left"
            >
              Back to sign in
            </button>
            <button
              type="submit"
              disabled={resetStatus.type === 'loading'}
              className="w-full sm:w-auto rounded-md bg-black px-4 py-2.5 sm:py-2.5 text-sm font-semibold text-white shadow transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetStatus.type === 'loading' ? 'Sending...' : 'Send reset email'}
            </button>
          </div>
        </form>
      )}

      {view === 'form' && status.type !== 'idle' && status.message && (
        <div
          className={`rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700'
              : status.type === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-zinc-100 text-black'
          }`}
        >
          {status.message}
        </div>
      )}

      {view === 'reset' && resetStatus.type !== 'idle' && resetStatus.message && (
        <div
          className={`rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium ${
            resetStatus.type === 'success'
              ? 'bg-green-50 text-green-700'
              : resetStatus.type === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-zinc-100 text-black'
          }`}
        >
          {resetStatus.message}
        </div>
      )}
    </div>
  )
}
