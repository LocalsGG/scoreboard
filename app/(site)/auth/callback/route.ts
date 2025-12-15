import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBaseUrlFromRequest } from '@/lib/urls'

/**
 * Gets the base URL for redirects, handling both local and production environments.
 */
async function getRedirectBaseUrl(request: Request): Promise<string> {
  // First check environment variable
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  // Try to get from request headers
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')
  
  const finalHost = forwardedHost || host
  if (finalHost) {
    // Determine protocol
    let protocol = 'https://'
    if (forwardedProto) {
      protocol = `${forwardedProto}://`
    } else if (process.env.NODE_ENV === 'development') {
      protocol = 'http://'
    }
    return `${protocol}${finalHost}`
  }

  // Fallback to origin from request URL
  const { origin } = new URL(request.url)
  return origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  const baseUrl = await getRedirectBaseUrl(request)
  
  // Handle OAuth errors
  if (error) {
    console.error('[AuthCallback] OAuth error:', error)
    return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(error)}`)
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
      return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(exchangeError.message)}`)
    }
    
    console.log('[AuthCallback] Code exchanged successfully, redirecting to:', `${baseUrl}${next}`)
    return NextResponse.redirect(`${baseUrl}${next}`)
  }
  
  // No code provided, redirect to auth page with error
  console.warn('[AuthCallback] No code provided in callback')
  return NextResponse.redirect(`${baseUrl}/auth?error=no_code`)
}


