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
                className="px-4 py-3 text-base font-semibold text-black rounded-md transition-colors hover:bg-black/5"
              >
                Pricing
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
