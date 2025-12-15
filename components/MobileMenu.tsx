'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface MobileMenuProps {
  email: string | null
  isGuest?: boolean
}

export function MobileMenu({ email, isGuest = false }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <div className="md:hidden relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
        className="flex flex-col gap-1.5 p-2 rounded-md transition-colors hover:bg-black/5"
      >
        <span
          className={`block h-0.5 w-6 bg-black transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-black transition-all duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-black transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white/95 backdrop-blur-md shadow-xl z-50 animate-rise overflow-y-auto">
            <div className="flex flex-col gap-1 p-4">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-base font-semibold text-black rounded-md transition-colors hover:bg-black/5"
              >
                Home
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-base font-semibold text-black rounded-md transition-colors hover:bg-black/5"
              >
                {(email || isGuest) && (
                  <svg
                    className="w-4 h-4 text-orange-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
                {isGuest ? 'Upgrade to save your boards' : email ? 'Upgrade for more boards' : 'Pricing'}
              </Link>
              {email && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-base font-semibold text-black rounded-md transition-colors hover:bg-black/5"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
