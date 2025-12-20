'use client'

import { useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type CreateBoardFormWrapperProps = {
  children: React.ReactNode
}

export function CreateBoardFormWrapper({ children }: CreateBoardFormWrapperProps) {
  const supabase = useMemo(() => createClient(), [])

  // Check for session on mount and create anonymous session if needed
  useEffect(() => {
    async function ensureSession() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        return
      }

      // No session, create anonymous one
      await supabase.auth.signInAnonymously()
    }

    ensureSession()
  }, [supabase])

  return <>{children}</>
}
