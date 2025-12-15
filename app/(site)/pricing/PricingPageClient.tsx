'use client'

import { useState, useEffect, useMemo } from 'react'
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

    if (shouldCheckout && plan && isAuthenticated) {
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
  
  // Lifetime deal counter (100 available)
  const lifetimeAvailable = 100
  const lifetimeSold = 0 // This could be fetched from your backend
  const lifetimeRemaining = lifetimeAvailable - lifetimeSold

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

    setLoading(plan)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          isAnnual: plan !== 'lifetime' ? isAnnual : false,
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
    }
  }

  return (
    <>
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-32 sm:pb-40 lg:pb-48">
      <Link
        href="/dashboard"
        className="self-start text-sm text-zinc-600 hover:text-black transition-colors flex items-center gap-1 mb-2 sm:mb-0"
      >
        <span>←</span>
        <span>Back to Dashboard</span>
      </Link>
      <section className="flex flex-col items-center gap-4 sm:gap-6 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black">
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


      <section className="grid gap-8 grid-cols-1 lg:grid-cols-4 max-w-7xl mx-auto w-full">
        {/* Base Tier */}
        <div className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-black">Base</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-black">Free</span>
            </div>
            <p className="text-sm text-zinc-600">
              Always free
            </p>
          </div>
          <ul className="flex flex-col gap-4 text-base">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">Create up to 1 board</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">No ads, ever - clean viewing experience</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold mt-0.5">✗</span>
              <span className="text-zinc-700">Match your brand with custom colors</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold mt-0.5">✗</span>
              <span className="text-zinc-700">Add team and sponsor logos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold mt-0.5">✗</span>
              <span className="text-zinc-700">Invite team members to collaborate</span>
            </li>
          </ul>
          <Link
            href="/auth"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Get Started
          </Link>
        </div>

        {/* Pro Tier - Center */}
        <div className="flex flex-col gap-6 rounded-lg border-2 border-black bg-black p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold uppercase">
            Popular
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white">Pro</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">${proPrice}</span>
              <span className="text-base text-zinc-300">/ month</span>
            </div>
            <p className="text-sm text-zinc-300">
              {isAnnual ? 'Billed annually • Save 50%' : 'Billed monthly, cancel anytime'}
            </p>
          </div>
          <p className="text-sm text-zinc-300 mb-2">
            Everything in Standard, and
          </p>
          <ul className="flex flex-col gap-4 text-base">
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✓</span>
              <span className="text-white">Create up to 200 scoreboards</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✓</span>
              <span className="text-white">No ads, ever - clean viewing experience</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✓</span>
              <span className="text-white">Match your brand with custom colors</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✓</span>
              <span className="text-white">Add team and sponsor logos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold mt-0.5">✓</span>
              <span className="text-white">Invite team members to collaborate</span>
            </li>
          </ul>
          <button
            onClick={() => handleCheckout('pro')}
            disabled={loading === 'pro'}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-black transition-colors hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'pro' ? 'Loading...' : 'Get Started'}
          </button>
        </div>

        {/* Standard Tier */}
        <div className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-black">Standard</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-black">${standardPrice}</span>
              <span className="text-base text-zinc-600">/ month</span>
            </div>
            <p className="text-sm text-zinc-600">
              {isAnnual ? 'Billed annually • Save 50%' : 'Billed monthly, cancel anytime'}
            </p>
          </div>
          <p className="text-sm text-zinc-600 mb-2">
            Everything in Base, and
          </p>
          <ul className="flex flex-col gap-4 text-base">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">Create up to 20 scoreboards</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">No ads, ever - clean viewing experience</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">Match your brand with custom colors</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">Add team and sponsor logos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">Invite team members to collaborate</span>
            </li>
          </ul>
          <button
            onClick={() => handleCheckout('standard')}
            disabled={loading === 'standard'}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'standard' ? 'Loading...' : 'Get Started'}
          </button>
        </div>

        {/* Enterprise Tier */}
        <div className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-black">Enterprise</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-black">Let&apos;s talk</span>
            </div>
            <p className="text-sm text-zinc-600">
              Custom solutions for your team
            </p>
          </div>
          <ul className="flex flex-col gap-4 text-base">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">Unlimited scoreboards</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">Everything in Pro</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">Custom integrations</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">Dedicated support</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-zinc-700">SLA guarantees</span>
            </li>
          </ul>
          <Link
            href="mailto:contact@locals.gg"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-6 py-3 text-base font-semibold text-black transition-colors hover:bg-zinc-50"
          >
            Contact Us
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-black text-black mb-8 text-center">Compare tiers & features</h2>
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200 bg-zinc-50">
              <div className="font-semibold text-black text-sm sm:text-base">Features</div>
              <div className="font-semibold text-black text-center text-xs sm:text-base">Base</div>
              <div className="font-semibold text-black text-center text-xs sm:text-base">Pro</div>
              <div className="font-semibold text-black text-center text-xs sm:text-base">Standard</div>
              <div className="font-semibold text-black text-center text-xs sm:text-base">Enterprise</div>
              <div className="font-semibold text-black text-center text-xs sm:text-base">Lifetime</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Scoreboards</div>
              <div className="text-center text-zinc-600 text-sm sm:text-base">1</div>
              <div className="text-center text-zinc-600 text-sm sm:text-base">200</div>
              <div className="text-center text-zinc-600 text-sm sm:text-base">20</div>
              <div className="text-center text-zinc-600 text-sm sm:text-base">Unlimited</div>
              <div className="text-center text-zinc-600 text-sm sm:text-base">200</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">No ads, ever - clean viewing experience</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Match your brand with custom colors</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Add team and sponsor logos</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Invite team members to collaborate</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Custom integrations</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-zinc-200">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">Dedicated support</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4">
              <div className="font-medium text-zinc-700 text-sm sm:text-base">All future updates included</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-red-600 font-bold text-sm sm:text-base">✗</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
              <div className="text-center text-green-600 font-bold text-sm sm:text-base">✓</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto w-full flex flex-col gap-4 text-center">
        <p className="text-sm text-zinc-600">
          By subscribing, you agree to our Terms of Service. Subscriptions auto-renew until canceled. Cancel anytime, at least 24 hours prior to renewal to avoid additional charges. Manage your subscription through the platform you subscribed on.
        </p>
        <p className="text-sm text-zinc-600">
          Lifetime deal is limited to the first 100 customers. Lifetime access includes Pro tier features and all future updates. No refunds on lifetime purchases.
        </p>
        <p className="text-sm text-zinc-600">
          All prices shown in US Dollars, excluding taxes. Applicable taxes will be calculated at checkout.
        </p>
      </section>

      <section className="max-w-6xl mx-auto w-full flex flex-col items-center gap-4 text-center rounded-lg border border-zinc-200 bg-white p-8">
        <h2 className="text-2xl font-black text-black">Looking for a custom solution?</h2>
        <p className="text-base text-zinc-700 max-w-2xl">
          Let&apos;s talk about your specific needs and how we can help.
        </p>
        <Link
          href="mailto:contact@locals.gg"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-6 py-3 text-base font-semibold text-black transition-colors hover:bg-zinc-50"
        >
          Contact Us
        </Link>
      </section>
    </main>

    {/* Lifetime Deal - Sticky Bottom Card */}
    <div
      id="lifetime-deal"
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        isLifetimeExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-t-2xl border-2 border-b-0 border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-2xl cursor-pointer"
          onClick={() => setIsLifetimeExpanded(!isLifetimeExpanded)}
        >
          {/* Collapsed Header - Always Visible */}
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="px-2 sm:px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold uppercase">
                Limited: First 100
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-black">Lifetime Deal</h3>
                <p className="text-sm text-zinc-700 font-semibold">$100 one-time • Pro tier for life</p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  <span className="font-bold text-orange-600">{lifetimeRemaining}</span>/{lifetimeAvailable} available
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-700 hidden sm:inline">
                {isLifetimeExpanded ? 'Tap to close' : 'Tap to expand'}
              </span>
              <svg
                className={`w-5 h-5 text-orange-500 transition-transform duration-300 ${
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
            <div className="px-4 sm:px-6 pb-6 sm:pb-8 border-t border-orange-200/50 animate-fade-in">
              <div className="flex flex-col md:flex-row items-start gap-6 pt-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-black">$100</span>
                    <span className="text-lg text-zinc-700">one-time</span>
                  </div>
                  <p className="text-base text-zinc-700 font-semibold">
                    Pro tier for life • All future updates included
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-sm font-bold text-orange-700">
                      <span className="font-black">{lifetimeRemaining}</span>/{lifetimeAvailable} available
                    </span>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <ul className="flex flex-col gap-3 text-sm sm:text-base">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span className="text-zinc-800">Create up to 200 scoreboards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span className="text-zinc-800">No ads, ever - clean viewing experience</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span className="text-zinc-800">Match your brand with custom colors</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span className="text-zinc-800">Add team and sponsor logos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span className="text-zinc-800">Invite team members to collaborate</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span className="text-zinc-800 font-semibold">All future updates included</span>
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCheckout('lifetime')
                    }}
                    disabled={loading === 'lifetime'}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold text-white transition-colors hover:bg-orange-600 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
