'use client'

import { useState } from 'react'

type CopyButtonProps = {
  value: string
  label?: string
  className?: string
}

export function CopyButton({ value, label = 'Copy', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ||
        "cursor-pointer inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white active:scale-95 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-900/70"
      }
    >
      <span>{copied ? 'Copied' : label}</span>
      <span aria-hidden className="text-xs">{copied ? '✓' : '⧉'}</span>
    </button>
  )
}
