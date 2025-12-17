'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function OAuthCallbackHandler() {
  const router = useRouter()
  const supabase = createClient()
  const hasRedirected = useRef(false)

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const syncSession = async () => {
      if (hasRedirected.current) return
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        hasRedirected.current = true
        window.history.replaceState(null, '', window.location.pathname)
        router.replace('/dashboard')
        return
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === 'SIGNED_IN' && nextSession?.user && !hasRedirected.current) {
          hasRedirected.current = true
          window.history.replaceState(null, '', window.location.pathname)
          router.replace('/dashboard')
        }
      })

      cleanup = () => subscription.unsubscribe()
    }

    syncSession()

    return () => {
      cleanup?.()
    }
  }, [router, supabase])

  return null
}


