import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  // Handle OAuth errors
  if (error) {
    console.error('[AuthCallback] OAuth error:', error)
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error)}`)
  }
  
  // If "next" is in param, use it as the redirect URL, otherwise default to dashboard
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }
  
  if (code) {
    console.log('[AuthCallback] Code received, exchanging for session...')
    const supabase = await createServerSupabaseClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('[AuthCallback] Code exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`)
    }
    
    console.log('[AuthCallback] Code exchanged successfully, redirecting to:', next)
    
    // Handle redirect with proper origin (for production with load balancers)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    if (isLocalEnv) {
      // In development, we can be sure there's no load balancer
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      // In production with load balancer, use the forwarded host
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      // Fallback to origin
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  
  // No code provided, redirect to auth page with error
  console.warn('[AuthCallback] No code provided in callback')
  return NextResponse.redirect(`${origin}/auth?error=no_code`)
}
