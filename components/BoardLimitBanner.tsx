'use client'

import { useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'dashboard-board-limit-banner-dismissed'

interface BoardLimitBannerProps {
  boardLimit: number
}

export function BoardLimitBanner({ boardLimit }: BoardLimitBannerProps) {
  // Initialize from localStorage to avoid hydration mismatch and setState in effect
  const [isDismissed, setIsDismissed] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) === 'true' : false
  )

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsDismissed(true)
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 text-sm relative">
      <button
        onClick={handleDismiss}
        aria-label="Dismiss board limit message"
        className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full text-orange-600 transition-colors hover:bg-orange-100 hover:text-orange-900 active:scale-95"
      >
        <span className="text-lg leading-none">×</span>
      </button>
      <div className="flex items-start justify-between gap-4 pr-8">
        <div className="flex-1">
          <p className="font-semibold text-orange-900">
            You&apos;ve reached your board limit ({boardLimit} board{boardLimit !== 1 ? 's' : ''})
          </p>
          <p className="mt-1 text-orange-700">
            <Link href="/pricing" className="font-semibold underline hover:text-orange-900">
              Upgrade your plan
            </Link>{" "}
            to create more scoreboards.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:scale-95 flex-shrink-0"
        >
          <span>Upgrade</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}

