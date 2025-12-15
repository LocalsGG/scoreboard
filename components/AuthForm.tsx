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
}

export function AuthForm({ isConverting = false, redirectTo, plan, isAnnual }: AuthFormProps) {
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
    : 'Sign in with your email and password. Switch modes or reset below.'

  useEffect(() => {
    let isMounted = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      const hasSession = !!data.session
      const isAnonymous = hasSession && !data.session?.user?.email
      if (hasSession && !isAnonymous && !isConverting) {
        if (redirectTo === 'pricing' && plan && (plan === 'standard' || plan === 'pro' || plan === 'lifetime')) {
          // Redirect back to pricing with plan info to trigger checkout
          const params = new URLSearchParams({ plan, ...(plan !== 'lifetime' && isAnnual && { isAnnual: 'true' }) })
          router.replace(`/pricing?checkout=true&${params.toString()}`)
        } else {
          router.replace('/dashboard')
        }
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const hasSession = !!session
      if (hasSession && session?.user?.email) {
        if (redirectTo === 'pricing' && plan && (plan === 'standard' || plan === 'pro' || plan === 'lifetime')) {
          // Trigger checkout directly after authentication
          await triggerCheckout(plan, isAnnual || false)
        } else {
          router.replace('/dashboard')
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router, isConverting, redirectTo, plan, isAnnual])

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
    
    // If redirecting to checkout, trigger checkout directly
    if (redirectTo === 'pricing' && plan && (plan === 'standard' || plan === 'pro' || plan === 'lifetime')) {
      await triggerCheckout(plan, isAnnual || false)
    } else {
      router.push('/dashboard')
    }
  }

  async function triggerCheckout(plan: 'standard' | 'pro' | 'lifetime', isAnnualPlan: boolean) {
    setStatus({ type: 'loading', message: 'Preparing checkout...' })
    
    // Get price ID based on plan
    let priceId: string | null = null
    if (plan === 'lifetime') {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME || null
    } else if (plan === 'standard') {
      priceId = isAnnualPlan
        ? (process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_ANNUAL || null)
        : (process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY || null)
    } else if (plan === 'pro') {
      priceId = isAnnualPlan
        ? (process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || null)
        : (process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || null)
    }

    if (!priceId) {
      setStatus({ type: 'error', message: 'Price configuration error. Please contact support.' })
      return
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          isAnnual: plan !== 'lifetime' ? isAnnualPlan : false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        // Redirect directly to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
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
    <div className="w-full max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black">{heroTitle}</h1>
        <p className="text-sm text-black">{heroSubtitle}</p>
        {isConverting && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mt-3">
            <p className="text-sm text-blue-800">
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
            className={`flex w-full items-center justify-center gap-3 rounded-md px-4 py-2 text-sm font-semibold transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${provider.className}`}
            style={provider.style}
          >
            <Image src={provider.icon} alt="" width={20} height={20} className="h-5 w-5" />
            {provider.label}
          </button>
        ))}
        {oauthStatus.type !== 'idle' && oauthStatus.message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
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

      <div className="flex items-center gap-4 text-xs font-semibold uppercase text-black">
        <span className="h-px flex-1 bg-black" />
        Or email
        <span className="h-px flex-1 bg-black" />
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
            <label className="block text-sm font-medium text-black">Email</label>
            <input
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black transition-all duration-150 placeholder:text-zinc-500 hover:-translate-y-0.5 hover:border-black/30 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] focus:outline-none active:scale-[0.99]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete={mode === 'signin' ? 'email' : 'new-email'}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-black">Password</label>
            <input
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black transition-all duration-150 placeholder:text-zinc-500 hover:-translate-y-0.5 hover:border-black/30 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] focus:outline-none active:scale-[0.99]"
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
              <label className="block text-sm font-medium text-black">
                Confirm password
              </label>
              <input
                className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black transition-all duration-150 placeholder:text-zinc-500 hover:-translate-y-0.5 hover:border-black/30 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] focus:outline-none active:scale-[0.99]"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setStatus({ type: 'idle' })
              }}
              className="text-black underline-offset-4 transition-transform duration-150 hover:-translate-y-0.5 hover:underline active:scale-95"
            >
              {toggleCopy} {toggleAction}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('reset')
                setResetStatus({ type: 'idle' })
              }}
              className="text-black underline-offset-4 transition-transform duration-150 hover:-translate-y-0.5 hover:underline active:scale-95"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={status.type === 'loading'}
            className="flex w-full items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
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
            <label className="block text-sm font-medium text-black">Email</label>
            <input
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black transition-all duration-150 placeholder:text-zinc-500 hover:-translate-y-0.5 hover:border-black/30 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] focus:outline-none active:scale-[0.99]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between text-sm gap-2">
            <button
              type="button"
              onClick={() => {
                setView('form')
                setResetStatus({ type: 'idle' })
              }}
              className="text-black underline-offset-4 transition-transform duration-150 hover:-translate-y-0.5 hover:underline active:scale-95"
            >
              Back to sign in
            </button>
            <button
              type="submit"
              disabled={resetStatus.type === 'loading'}
              className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
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
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
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
