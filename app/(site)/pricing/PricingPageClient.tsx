'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PricingToggle } from '@/components/PricingToggle'

export function PricingPageClient() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isAnnual, setIsAnnual] = useState(false)
  const [isLifetimeExpanded, setIsLifetimeExpanded] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const hasAutoCheckoutFiredRef = useRef(false)
  const isCheckoutInFlightRef = useRef(false)

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session?.user)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])


  // Check for checkout redirect after OAuth (when coming from callback)
  useEffect(() => {
    if (isAuthenticated === null) return // Wait for auth check to complete

    const params = new URLSearchParams(window.location.search)
    const shouldCheckout = params.get('checkout') === 'true'
    const plan = params.get('plan') as 'standard' | 'pro' | 'lifetime' | null
    const isAnnualParam = params.get('isAnnual') === 'true'

    if (hasAutoCheckoutFiredRef.current) return
    if (shouldCheckout && plan && isAuthenticated) {
      hasAutoCheckoutFiredRef.current = true
      // Set annual toggle if needed
      if (isAnnualParam && plan !== 'lifetime') {
        setIsAnnual(true)
      }
      
      // Clean up URL params first
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('checkout')
      newUrl.searchParams.delete('plan')
      newUrl.searchParams.delete('isAnnual')
      window.history.replaceState({}, '', newUrl.toString())

      // Trigger checkout
      handleCheckout(plan)
    }
  }, [isAuthenticated])

  // Check for lifetime hash on mount and when hash changes
  useEffect(() => {
    function checkHash() {
      if (window.location.hash === '#lifetime') {
        setIsLifetimeExpanded(true)
        // Scroll to bottom to show the card
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        }, 100)
      }
    }
    
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])
  
  // Countdown timer state
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  // Countdown timer to Jan 1st 2026
  useEffect(() => {
    const endDate = new Date('2026-01-01T00:00:00Z').getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = endDate - now

      if (distance > 0) {
        setTimeRemaining({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [])

  const standardPrice = isAnnual ? 10 : 20
  const proPrice = isAnnual ? 20 : 40

  // Get price IDs from environment variables
  const getPriceId = (plan: 'standard' | 'pro' | 'lifetime') => {
    if (plan === 'lifetime') {
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME
    }
    if (plan === 'standard') {
      return isAnnual 
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_ANNUAL
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY
    }
    if (plan === 'pro') {
      return isAnnual
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
    }
    return null
  }

  const handleCheckout = async (plan: 'standard' | 'pro' | 'lifetime') => {
    if (isCheckoutInFlightRef.current) return
    if (loading) return

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store the plan and pricing info in URL params for redirect after auth
      const params = new URLSearchParams({
        plan,
        ...(plan !== 'lifetime' && { isAnnual: isAnnual.toString() }),
      })
      router.push(`/auth?redirect=pricing&${params.toString()}`)
      return
    }

    const priceId = getPriceId(plan)
    
    if (!priceId) {
      setError('Price configuration error. Please contact support.')
      return
    }

    isCheckoutInFlightRef.current = true
    setLoading(plan)
    setError(null)

    try {
      const checkoutRequestId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-checkout-request-id': checkoutRequestId,
        },
        body: JSON.stringify({
          priceId,
          isAnnual: plan !== 'lifetime' ? isAnnual : false,
          checkoutRequestId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(null)
      isCheckoutInFlightRef.current = false
    }
  }

  return (
    <>
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-32 sm:pb-40 lg:pb-48">
      <Link
        href={isAuthenticated ? "/dashboard" : "/"}
        className="self-start text-sm text-zinc-600 hover:text-black transition-colors flex items-center gap-1 mb-2 sm:mb-0"
      >
        <span>←</span>
        <span>{isAuthenticated ? "Back to Dashboard" : "Back to Home"}</span>
      </Link>
      <section className="flex flex-col items-center gap-3 sm:gap-4 lg:gap-6 text-center px-4 sm:px-0">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-black">
          Pricing
        </h1>
        <PricingToggle 
          onToggle={setIsAnnual} 
          onLifetimeClick={() => {
            setIsLifetimeExpanded(true)
          }}
        />
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-md">
            {error}
          </div>
        )}
      </section>


      <section className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto w-full">
        {/* Base Tier */}
        <div className="flex flex-col gap-4 sm:gap-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-black">Base</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-black">Free</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600">
              Always free
            </p>
          </div>
          <ul className="flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">Create up to 1 board</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">No ads, ever - clean viewing experience</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="text-red-600 mt-0.5 w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-zinc-700">Match your brand with custom colors</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="text-red-600 mt-0.5 w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-zinc-700">Add team and sponsor logos</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="text-red-600 mt-0.5 w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-zinc-700">Invite team members to collaborate</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">All future updates included</span>
            </li>
          </ul>
          <Link
            href="/auth"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Get Started
          </Link>
        </div>

        {/* Pro Tier - Center */}
        <div className="flex flex-col gap-4 sm:gap-6 rounded-lg border-2 border-black bg-black p-4 sm:p-6 lg:p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold uppercase">
            Popular
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-white">Pro</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">${proPrice}</span>
              <span className="text-sm sm:text-base text-zinc-300">/ month</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300">
              {isAnnual ? 'Billed annually • Save 50%' : 'Billed monthly, cancel anytime'}
            </p>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 mb-2">
            Everything in Standard, and
          </p>
          <ul className="flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✔</span>
              <span className="text-white">Create up to 200 scoreboards</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✔</span>
              <span className="text-white">No ads, ever - clean viewing experience</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✔</span>
              <span className="text-white">Match your brand with custom colors</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✔</span>
              <span className="text-white">Add team and sponsor logos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✔</span>
              <span className="text-white">Invite team members to collaborate</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✔</span>
              <span className="text-white">All future updates included</span>
            </li>
          </ul>
          <button
            onClick={() => handleCheckout('pro')}
            disabled={loading === 'pro'}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-black transition-colors hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'pro' ? 'Loading...' : 'Get Started'}
          </button>
        </div>

        {/* Standard Tier */}
        <div className="flex flex-col gap-4 sm:gap-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-black">Standard</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-black">${standardPrice}</span>
              <span className="text-sm sm:text-base text-zinc-600">/ month</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600">
              {isAnnual ? 'Billed annually • Save 50%' : 'Billed monthly, cancel anytime'}
            </p>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 mb-2">
            Everything in Base, and
          </p>
          <ul className="flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">Create up to 20 scoreboards</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">No ads, ever - clean viewing experience</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">Match your brand with custom colors</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">Add team and sponsor logos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">Invite team members to collaborate</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">All future updates included</span>
            </li>
          </ul>
          <button
            onClick={() => handleCheckout('standard')}
            disabled={loading === 'standard'}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'standard' ? 'Loading...' : 'Get Started'}
          </button>
        </div>

        {/* Enterprise Tier */}
        <div className="flex flex-col gap-4 sm:gap-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-black">Enterprise</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-black">Let&apos;s talk</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600">
              Custom solutions for your team
            </p>
          </div>
          <ul className="flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">Unlimited scoreboards</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">Everything in Pro</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">Custom integrations</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">Dedicated support</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✔</span>
              <span className="text-zinc-700">SLA guarantees</span>
            </li>
          </ul>
          <Link
            href="mailto:contact@locals.gg"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-black transition-colors hover:bg-zinc-50"
          >
            Contact Us
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto w-full">
        <h2 className="text-xl sm:text-2xl font-black text-black mb-4 sm:mb-6 lg:mb-8 text-center px-4">Compare tiers & features</h2>
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white overflow-x-auto mx-4 sm:mx-0">
          <div className="min-w-[600px] sm:min-w-0">
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200 bg-zinc-50">
              <div className="font-semibold text-black text-sm sm:text-base">Features</div>
              <div className="font-semibold text-black text-center text-xs sm:text-base">Base</div>
              <div className="font-semibold text-black text-center text-xs sm:text-base relative bg-gradient-to-br from-orange-50 to-orange-100/50 border-l-2 border-r-2 border-orange-500 py-2 -mx-2 sm:-mx-4">
                <span>Pro</span>
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase whitespace-nowrap">Popular</span>
              </div>
              <div className="font-semibold text-black text-center text-xs sm:text-base">Standard</div>
              <div className="font-semibold text-black text-center text-xs sm:text-base">Enterprise</div>
              <div className="font-semibold text-black text-center text-xs sm:text-base">Lifetime</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Scoreboards</div>
              <div className="text-center text-zinc-600 text-sm sm:text-base">1</div>
              <div className="text-center text-black font-bold text-sm sm:text-base bg-gradient-to-br from-orange-50 to-orange-100/50 border-l-2 border-r-2 border-orange-500 py-2 -mx-2 sm:-mx-4">200</div>
              <div className="text-center text-zinc-600 text-sm sm:text-base">20</div>
              <div className="text-center text-zinc-600 text-sm sm:text-base">Unlimited</div>
              <div className="text-center text-zinc-600 text-sm sm:text-base">200</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">No ads, ever - clean viewing experience</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-lg sm:text-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border-l-2 border-r-2 border-orange-500 py-2 -mx-2 sm:-mx-4">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Match your brand with custom colors</div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center text-green-600 font-bold text-lg sm:text-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border-l-2 border-r-2 border-orange-500 py-2 -mx-2 sm:-mx-4">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Add team and sponsor logos</div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center text-green-600 font-bold text-lg sm:text-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border-l-2 border-r-2 border-orange-500 py-2 -mx-2 sm:-mx-4">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Invite team members to collaborate</div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center text-green-600 font-bold text-lg sm:text-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border-l-2 border-r-2 border-orange-500 py-2 -mx-2 sm:-mx-4">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Custom integrations</div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Dedicated support</div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">All future updates included</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-lg sm:text-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border-l-2 border-r-2 border-orange-500 py-2 -mx-2 sm:-mx-4">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✔</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto w-full flex flex-col gap-3 sm:gap-4 text-center px-4 sm:px-0">
        <p className="text-xs sm:text-sm text-zinc-600">
          By subscribing, you agree to our Terms of Service. Subscriptions auto-renew until canceled. Cancel anytime, at least 24 hours prior to renewal to avoid additional charges. Manage your subscription through the platform you subscribed on.
        </p>
        <p className="text-xs sm:text-sm text-zinc-600">
          Lifetime deal ends January 1st, 2026. Lifetime access includes Pro tier features and all future updates. No refunds on lifetime purchases.
        </p>
        <p className="text-xs sm:text-sm text-zinc-600">
          All prices shown in US Dollars, excluding taxes. Applicable taxes will be calculated at checkout.
        </p>
      </section>
    </main>

    {/* Lifetime Deal - Sticky Bottom Card */}
    <div
      id="lifetime-deal"
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        isLifetimeExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-90px)] sm:translate-y-[calc(100%-80px)]'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-t-2xl border-2 border-b-0 border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-2xl cursor-pointer"
          onClick={() => setIsLifetimeExpanded(!isLifetimeExpanded)}
        >
          {/* Collapsed Header - Always Visible */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
              <div className="px-2 sm:px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold uppercase whitespace-nowrap">
                Limited Time
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg lg:text-xl font-black text-black">Lifetime Deal</h3>
                <p className="text-xs sm:text-sm text-zinc-700 font-semibold">$100 one-time • Pro tier for life</p>
                {timeRemaining && (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5">
                    <span className="text-xs sm:text-sm text-zinc-600 font-semibold">Ends in:</span>
                    {timeRemaining.days > 0 && (
                      <span className="px-1.5 sm:px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm font-bold text-orange-700">
                        {timeRemaining.days}d
                      </span>
                    )}
                    <span className="px-1.5 sm:px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm font-bold text-orange-700">
                      {String(timeRemaining.hours).padStart(2, '0')}h
                    </span>
                    <span className="px-1.5 sm:px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm font-bold text-orange-700">
                      {String(timeRemaining.minutes).padStart(2, '0')}m
                    </span>
                    <span className="px-1.5 sm:px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm font-bold text-orange-700">
                      {String(timeRemaining.seconds).padStart(2, '0')}s
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs sm:text-sm font-semibold text-zinc-700 hidden sm:inline">
                {isLifetimeExpanded ? 'Tap to close' : 'Tap to expand'}
              </span>
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 text-orange-500 transition-transform duration-300 flex-shrink-0 ${
                  isLifetimeExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </div>

          {/* Expanded Content */}
          {isLifetimeExpanded && (
            <div className="px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8 border-t border-orange-200/50 animate-fade-in">
              <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6 pt-4 sm:pt-6">
                <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-black">$100</span>
                    <span className="text-base sm:text-lg text-zinc-700">one-time</span>
                  </div>
                  <p className="text-sm sm:text-base text-zinc-700 font-semibold">
                    Pro tier for life • All future updates included
                  </p>
                  {timeRemaining && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                      <span className="text-xs sm:text-sm text-zinc-600 font-semibold">Deal ends in:</span>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {timeRemaining.days > 0 && (
                          <div className="flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 min-w-[50px] sm:min-w-[60px]">
                            <span className="text-lg sm:text-xl lg:text-2xl font-black text-orange-700">{timeRemaining.days}</span>
                            <span className="text-xs text-orange-600 font-semibold">days</span>
                          </div>
                        )}
                        <div className="flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 min-w-[50px] sm:min-w-[60px]">
                          <span className="text-lg sm:text-xl lg:text-2xl font-black text-orange-700">{String(timeRemaining.hours).padStart(2, '0')}</span>
                          <span className="text-xs text-orange-600 font-semibold">hours</span>
                        </div>
                        <div className="flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 min-w-[50px] sm:min-w-[60px]">
                          <span className="text-lg sm:text-xl lg:text-2xl font-black text-orange-700">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                          <span className="text-xs text-orange-600 font-semibold">mins</span>
                        </div>
                        <div className="flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 min-w-[50px] sm:min-w-[60px]">
                          <span className="text-lg sm:text-xl lg:text-2xl font-black text-orange-700">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                          <span className="text-xs text-orange-600 font-semibold">secs</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full lg:max-w-md">
                  <ul className="flex flex-col gap-2 sm:gap-3 text-sm sm:text-base">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✔</span>
                      <span className="text-zinc-800">Create up to 200 scoreboards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✔</span>
                      <span className="text-zinc-800">No ads, ever - clean viewing experience</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✔</span>
                      <span className="text-zinc-800">Match your brand with custom colors</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✔</span>
                      <span className="text-zinc-800">Add team and sponsor logos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✔</span>
                      <span className="text-zinc-800">Invite team members to collaborate</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✔</span>
                      <span className="text-zinc-800 font-semibold">All future updates included</span>
                    </li>
                  </ul>
                </div>
                <div className="w-full lg:w-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCheckout('lifetime')
                    }}
                    disabled={loading === 'lifetime'}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-orange-600 w-full lg:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === 'lifetime' ? 'Loading...' : 'Claim Lifetime Deal'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
