'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Handles OAuth callbacks by checking for hash fragments and redirecting authenticated users.
 * This component should be placed in the auth page to handle OAuth redirects properly.
 */
export function OAuthCallbackHandler() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function handleCallback() {
      // Check if there's a hash fragment (Supabase OAuth callbacks use hash fragments)
      if (typeof window !== 'undefined' && window.location.hash) {
        // Parse the hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const error = hashParams.get('error')

        if (error) {
          console.error('OAuth error:', error)
          return
        }

        if (accessToken) {
          // Session should be set automatically by Supabase
          // Wait a moment for the session to be established
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.user.email) {
            // Clear the hash fragment and redirect
            window.history.replaceState(null, '', window.location.pathname)
            router.replace('/dashboard')
          }
        }
      } else {
        // Check for existing session (in case hash was already processed)
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.user.email) {
          router.replace('/dashboard')
        }
      }
    }

    handleCallback()

    // Also listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user.email) {
        // Clear hash if present
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname)
        }
        router.replace('/dashboard')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return null
}
