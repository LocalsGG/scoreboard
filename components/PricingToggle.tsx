'use client'

import { useState } from 'react'

type PricingOption = 'monthly' | 'annual' | 'lifetime'

interface PricingToggleProps {
  onToggle: (isAnnual: boolean) => void
  onLifetimeClick?: () => void
}

export function PricingToggle({ onToggle, onLifetimeClick }: PricingToggleProps) {
  const [selectedOption, setSelectedOption] = useState<PricingOption>('annual')

  function handleOptionSelect(option: PricingOption) {
    setSelectedOption(option)
    
    if (option === 'lifetime') {
      if (onLifetimeClick) {
        onLifetimeClick()
      } else {
        window.location.hash = '#lifetime'
      }
    } else {
      onToggle(option === 'annual')
    }
  }

  const getSliderPosition = () => {
    switch (selectedOption) {
      case 'annual':
        return 'translate-x-0'
      case 'monthly':
        return 'translate-x-[100%]'
      case 'lifetime':
        return 'translate-x-[200%]'
    }
  }

  const getSliderColor = () => {
    return selectedOption === 'lifetime' ? 'bg-orange-500' : 'bg-black'
  }

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="relative inline-flex bg-white border-2 border-black rounded-full p-1.5">
        {/* Sliding indicator */}
        <div
          className={`absolute top-1.5 bottom-1.5 w-[calc(33.333%-0.5rem)] ${getSliderColor()} rounded-full transition-all duration-300 ease-out ${getSliderPosition()}`}
        />
        
        {/* Options */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => handleOptionSelect('annual')}
            className={`relative z-10 px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
              selectedOption === 'annual'
                ? 'text-white'
                : 'text-black hover:text-zinc-600'
            }`}
          >
            Annual
          </button>
          <button
            type="button"
            onClick={() => handleOptionSelect('monthly')}
            className={`relative z-10 px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
              selectedOption === 'monthly'
                ? 'text-white'
                : 'text-black hover:text-zinc-600'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => handleOptionSelect('lifetime')}
            className={`relative z-10 px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
              selectedOption === 'lifetime'
                ? 'text-white'
                : 'text-black hover:text-zinc-600'
            }`}
          >
            Lifetime
          </button>
        </div>
      </div>
    </div>
  )
}


