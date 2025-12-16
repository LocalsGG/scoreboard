'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'dashboard-upgrade-banner-dismissed'

export function UpgradeBanner() {
  const [isDismissed, setIsDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem(STORAGE_KEY)
    setIsDismissed(dismissed === 'true')
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsDismissed(true)
  }

  // Don't render until we've checked localStorage to avoid hydration mismatch
  if (isDismissed === null || isDismissed) {
    return null
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-sm relative">
      <button
        onClick={handleDismiss}
        aria-label="Dismiss upgrade message"
        className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-900 active:scale-95"
      >
        <span className="text-lg leading-none">×</span>
      </button>
      <div className="flex items-start justify-between gap-4 pr-8">
        <div className="flex-1">
          <p className="font-semibold text-blue-900">
            Upgrade to Pro to create up to 200 scoreboards
          </p>
          <p className="mt-1 text-blue-700">
            You&apos;re currently on the base plan (1 board limit).{" "}
            <Link href="/pricing" className="font-semibold underline hover:text-blue-900">
              Upgrade to Pro
            </Link>{" "}
            to create up to 200 scoreboards.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:scale-95 flex-shrink-0"
        >
          <span>Upgrade</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
