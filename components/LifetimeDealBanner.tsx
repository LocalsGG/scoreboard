'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function LifetimeDealBanner() {
  const [isLifetimeExpanded, setIsLifetimeExpanded] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

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

  // Auto-collapse when scrolling near bottom
  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Calculate distance from bottom
      const distanceFromBottom = documentHeight - (scrollTop + windowHeight)
      
      // Collapse if within 200px of bottom
      if (distanceFromBottom < 200 && isLifetimeExpanded) {
        setIsLifetimeExpanded(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLifetimeExpanded])

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

  return (
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
                  <Link
                    href="/pricing#lifetime"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-orange-600 w-full lg:w-auto"
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
  )
}

