'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PricingToggleProps {
  onToggle: (isAnnual: boolean) => void
  onLifetimeClick?: () => void
}

export function PricingToggle({ onToggle, onLifetimeClick }: PricingToggleProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  function handleToggle(value: boolean) {
    setIsAnnual(value)
    onToggle(value)
  }

  function handleLifetimeClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    if (onLifetimeClick) {
      onLifetimeClick()
    } else {
      // Fallback to hash navigation
      window.location.hash = '#lifetime'
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
      <button
        type="button"
        onClick={() => handleToggle(false)}
        className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-all ${
          !isAnnual
            ? 'bg-black text-white shadow-lg'
            : 'bg-white text-black border border-black/10 hover:bg-black/5'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => handleToggle(true)}
        className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-all ${
          isAnnual
            ? 'bg-black text-white shadow-lg'
            : 'bg-white text-black border border-black/10 hover:bg-black/5'
        }`}
      >
        Annual subscription
        {isAnnual && (
          <span className="ml-2 text-xs font-bold opacity-90">Save 50%</span>
        )}
      </button>
      <Link
        href="#lifetime"
        onClick={handleLifetimeClick}
        className="px-5 py-2.5 text-sm font-semibold rounded-md transition-all bg-orange-500 text-white hover:bg-orange-600 shadow-lg"
      >
        Lifetime Deal
      </Link>
    </div>
  )
}
