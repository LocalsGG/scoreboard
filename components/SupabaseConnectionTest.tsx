'use client'

import { useState } from 'react'

// Define the structure of the data you expect from the database
interface ScoreboardData {
  id: string
  name: string | null
  a_side: string
  b_side: string
  a_score: number
  b_score: number
  updated_at: string
}

interface TestProps {
    initialData: ScoreboardData | null;
    error: string | null;
}

export function SupabaseConnectionTest({ initialData, error }: TestProps) {
  const [data] = useState<ScoreboardData | null>(initialData)
  
  if (error) {
    return (
      <div className="space-y-2 text-sm text-red-800 dark:text-red-200">
        <span className="inline-flex items-center gap-2 rounded-full bg-red-100/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-800 dark:bg-red-950/40 dark:text-red-100">
          Connection failed
        </span>
        <p>Error: {error}</p>
        <p className="text-xs opacity-80">
          Verify `.env.local` (URL + publishable key) and RLS on `scoreboards` allows anon SELECT (see README SQL).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm text-emerald-800 dark:text-emerald-100">
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
        Connected
      </span>
      <p className="text-xs text-emerald-700 dark:text-emerald-200/80">Fetched from `scoreboards`.</p>
      {data ? (
        <pre className="overflow-x-auto rounded-lg bg-white/80 p-3 text-[13px] text-black dark:bg-black/50 dark:text-white">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="text-orange-600 dark:text-orange-300">Connected, but `scoreboards` is empty.</p>
      )}
    </div>
  )
}
