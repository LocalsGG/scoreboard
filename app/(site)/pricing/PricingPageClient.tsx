'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PricingToggle } from '@/components/PricingToggle'

export function PricingPageClient() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [isLifetimeExpanded, setIsLifetimeExpanded] = useState(false)

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
      </section>


      <section className="grid gap-8 grid-cols-1 lg:grid-cols-3 max-w-6xl mx-auto w-full">
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

        {/* Standard Tier */}
        <div className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-black">Standard</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-black">${standardPrice}</span>
              <span className="text-base text-zinc-600">/ month</span>
            </div>
            <p className="text-sm text-zinc-600">
              {isAnnual ? 'Billed annually' : 'Billed monthly, cancel anytime'}
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
          <Link
            href="/auth"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Get Started
          </Link>
        </div>

        {/* Pro Tier */}
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
              {isAnnual ? 'Billed annually' : 'Billed monthly, cancel anytime'}
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
          <Link
            href="/auth"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-black transition-colors hover:bg-zinc-100"
          >
            Get Started
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-black text-black mb-8 text-center">Compare tiers & features</h2>
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-200 bg-zinc-50">
            <div className="font-semibold text-black">Features</div>
            <div className="font-semibold text-black text-center">Base</div>
            <div className="font-semibold text-black text-center">Standard</div>
            <div className="font-semibold text-black text-center">Pro</div>
            <div className="font-semibold text-black text-center">Lifetime</div>
          </div>
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-200">
            <div className="font-medium text-zinc-700">Scoreboards</div>
            <div className="text-center text-zinc-600">1</div>
            <div className="text-center text-zinc-600">20</div>
            <div className="text-center text-zinc-600">200</div>
            <div className="text-center text-zinc-600">200</div>
          </div>
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-200">
            <div className="font-medium text-zinc-700">No ads, ever - clean viewing experience</div>
            <div className="text-center text-green-600 font-bold">✓</div>
            <div className="text-center text-green-600 font-bold">✓</div>
            <div className="text-center text-green-600 font-bold">✓</div>
            <div className="text-center text-green-600 font-bold">✓</div>
          </div>
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-200">
            <div className="font-medium text-zinc-700">Match your brand with custom colors</div>
            <div className="text-center text-red-600 font-bold">✗</div>
            <div className="text-center text-green-600 font-bold">✓</div>
            <div className="text-center text-green-600 font-bold">✓</div>
            <div className="text-center text-green-600 font-bold">✓</div>
          </div>
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-200">
            <div className="font-medium text-zinc-700">Add team and sponsor logos</div>
            <div className="text-center text-red-600 font-bold">✗</div>
            <div className="text-center text-green-600 font-bold">✓</div>
            <div className="text-center text-green-600 font-bold">✓</div>
            <div className="text-center text-green-600 font-bold">✓</div>
          </div>
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-200">
            <div className="font-medium text-zinc-700">Invite team members to collaborate</div>
            <div className="text-center text-red-600 font-bold">✗</div>
            <div className="text-center text-green-600 font-bold">✓</div>
            <div className="text-center text-green-600 font-bold">✓</div>
            <div className="text-center text-green-600 font-bold">✓</div>
          </div>
          <div className="grid grid-cols-5 gap-4 p-4">
            <div className="font-medium text-zinc-700">All future updates included</div>
            <div className="text-center text-red-600 font-bold">✗</div>
            <div className="text-center text-red-600 font-bold">✗</div>
            <div className="text-center text-red-600 font-bold">✗</div>
            <div className="text-center text-green-600 font-bold">✓</div>
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
                  <Link
                    href="/auth"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold text-white transition-colors hover:bg-orange-600 w-full md:w-auto"
                  >
                    Claim Lifetime Deal
                  </Link>
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
