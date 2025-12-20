'use client'

import { useRouter } from 'next/navigation'

type PricingRedirectButtonProps = {
  label: string
  redirectPath: string
  className?: string
}

export function PricingRedirectButton({ label, redirectPath, className }: PricingRedirectButtonProps) {
  const router = useRouter()

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/pricing?redirect=${encodeURIComponent(redirectPath)}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {label}
    </button>
  )
}
