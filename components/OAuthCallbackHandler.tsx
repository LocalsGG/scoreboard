'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Handles OAuth callbacks by checking for hash fragments and redirecting authenticated users.
 * This component should be placed in the auth page to handle OAuth redirects properly.
 */
export function OAuthCallbackHandler() {
  const router = useRouter()
  const supabase = createClient()
  const hasRedirected = useRef(false)

  useEffect(() => {
    console.log('[OAuthCallbackHandler] Component mounted')
    console.log('[OAuthCallbackHandler] Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')
    console.log('[OAuthCallbackHandler] Hash:', typeof window !== 'undefined' ? window.location.hash : 'N/A')
    console.log('[OAuthCallbackHandler] Search params:', typeof window !== 'undefined' ? window.location.search : 'N/A')
    console.log('[OAuthCallbackHandler] Full location:', typeof window !== 'undefined' ? {
      href: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    } : 'N/A')

    async function handleCallback() {
      // Prevent multiple redirects
      if (hasRedirected.current) {
        console.log('[OAuthCallbackHandler] Already redirected, skipping')
        return
      }

      // Check if there's a hash fragment (Supabase OAuth callbacks use hash fragments)
      // Also check query parameters as fallback
      const hasHash = typeof window !== 'undefined' && window.location.hash
      const hasQuery = typeof window !== 'undefined' && window.location.search
      const isRootPath = typeof window !== 'undefined' && window.location.pathname === '/'
      console.log('[OAuthCallbackHandler] Has hash fragment:', hasHash)
      console.log('[OAuthCallbackHandler] Has query params:', hasQuery)
      console.log('[OAuthCallbackHandler] Is root path:', isRootPath)
      
      // Check hash fragment first (preferred method)
      if (hasHash) {
        // Parse the hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const error = hashParams.get('error')

        console.log('[OAuthCallbackHandler] Hash params:', {
          hasAccessToken: !!accessToken,
          hasError: !!error,
          error: error || null,
        })

        if (error) {
          console.error('[OAuthCallbackHandler] OAuth error:', error)
          return
        }

        if (accessToken) {
          console.log('[OAuthCallbackHandler] Access token found, waiting for session...')
          // Wait for Supabase to process the session
          // Try multiple times with increasing delays
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)))
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            console.log(`[OAuthCallbackHandler] Session check attempt ${i + 1}/5:`, {
              hasSession: !!session,
              hasEmail: !!session?.user?.email,
              email: session?.user?.email || null,
              userId: session?.user?.id || null,
              error: sessionError?.message || null,
            })
            
            if (session && session.user?.email) {
              console.log('[OAuthCallbackHandler] Session found with email, redirecting to dashboard')
              hasRedirected.current = true
              // Clear the hash fragment and redirect
              window.history.replaceState(null, '', window.location.pathname)
              router.replace('/dashboard')
              return
            }
          }
          console.warn('[OAuthCallbackHandler] Session not found after 5 attempts')
        } else {
          console.log('[OAuthCallbackHandler] No access token in hash')
        }
      } else if (hasQuery) {
        // Check query parameters as fallback (some OAuth flows use query params)
        const queryParams = new URLSearchParams(window.location.search)
        const accessToken = queryParams.get('access_token')
        const code = queryParams.get('code') // PKCE code
        const error = queryParams.get('error')
        
        console.log('[OAuthCallbackHandler] Query params:', {
          hasAccessToken: !!accessToken,
          hasCode: !!code,
          hasError: !!error,
          error: error || null,
        })
        
        if (error) {
          console.error('[OAuthCallbackHandler] OAuth error from query:', error)
          return
        }
        
        // Handle PKCE code (Supabase SSR uses this)
        // Note: The callback route should handle this, but we keep this as a fallback
        if (code) {
          console.log('[OAuthCallbackHandler] PKCE code found in query - callback route should handle this')
          // The callback route at /auth/callback should have already handled the code exchange
          // If we're seeing the code here, it means we're not on the callback route
          // This shouldn't happen in normal flow, but we'll handle it as a fallback
          const isCallbackRoute = typeof window !== 'undefined' && window.location.pathname === '/auth/callback'
          
          if (!isCallbackRoute) {
            console.warn('[OAuthCallbackHandler] Code found but not on callback route - redirecting to callback')
            hasRedirected.current = true
            router.replace(`/auth/callback?code=${code}`)
            return
          }
          
          // If we're on the callback route, wait for the server to exchange the code
          console.log('[OAuthCallbackHandler] On callback route with code - waiting for server exchange...')
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)))
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            console.log(`[OAuthCallbackHandler] Session check attempt ${i + 1}/5 (on callback route):`, {
              hasSession: !!session,
              hasEmail: !!session?.user?.email,
              email: session?.user?.email || null,
              userId: session?.user?.id || null,
              error: sessionError?.message || null,
            })
            
            if (session && session.user?.email) {
              console.log('[OAuthCallbackHandler] Session found - callback route should redirect')
              // The callback route will handle the redirect, so we don't need to do anything here
              return
            }
          }
          console.warn('[OAuthCallbackHandler] Session not found after 5 attempts on callback route')
        } else if (accessToken) {
          console.log('[OAuthCallbackHandler] Access token found in query, waiting for session...')
          // Wait for Supabase to process the session
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)))
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            console.log(`[OAuthCallbackHandler] Session check attempt ${i + 1}/5 (from query):`, {
              hasSession: !!session,
              hasEmail: !!session?.user?.email,
              email: session?.user?.email || null,
              userId: session?.user?.id || null,
              error: sessionError?.message || null,
            })
            
            if (session && session.user?.email) {
              console.log('[OAuthCallbackHandler] Session found with email (from query), redirecting to dashboard')
              hasRedirected.current = true
              // Clear the query parameters and redirect
              window.history.replaceState(null, '', window.location.pathname)
              router.replace('/dashboard')
              return
            }
          }
          console.warn('[OAuthCallbackHandler] Session not found after 5 attempts (from query)')
        }
      } else {
        console.log('[OAuthCallbackHandler] No hash fragment, checking for existing session...')
        // Check for existing session (in case hash was already processed or user is already logged in)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('[OAuthCallbackHandler] Existing session check:', {
          hasSession: !!session,
          hasEmail: !!session?.user?.email,
          email: session?.user?.email || null,
          userId: session?.user?.id || null,
          error: sessionError?.message || null,
        })
        
        if (session && session.user?.email) {
          console.log('[OAuthCallbackHandler] Existing session found, redirecting to dashboard')
          hasRedirected.current = true
          router.replace('/dashboard')
          return
        } else {
          console.log('[OAuthCallbackHandler] No existing session found')
        }
      }
    }

    handleCallback()

    // Also listen for auth state changes - this is the most reliable way
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[OAuthCallbackHandler] Auth state changed:', {
        event,
        hasSession: !!session,
        hasEmail: !!session?.user?.email,
        email: session?.user?.email || null,
        userId: session?.user?.id || null,
        hasRedirected: hasRedirected.current,
      })

      // Only redirect on SIGNED_IN event to avoid redirect loops
      if (event === 'SIGNED_IN' && session && session.user?.email && !hasRedirected.current) {
        console.log('[OAuthCallbackHandler] SIGNED_IN event detected, redirecting to dashboard')
        hasRedirected.current = true
        // Clear hash if present
        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname)
        }
        router.replace('/dashboard')
      }
    })

    return () => {
      console.log('[OAuthCallbackHandler] Component unmounting, unsubscribing')
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return null
}

