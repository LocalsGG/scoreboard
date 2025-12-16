import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function normalizeBaseUrl(url: string | null | undefined, fallbackOrigin: string) {
  if (!url) {
    return fallbackOrigin
  }

  const trimmed = url.trim().replace(/\/$/, '')
  const hasProtocol = /^https?:\/\//i.test(trimmed)
  const withProtocol = hasProtocol
    ? trimmed
    : `${process.env.NODE_ENV === 'development' ? 'http://' : 'https://'}${trimmed}`

  try {
    return new URL(withProtocol).origin
  } catch {
    return fallbackOrigin
  }
}

async function getRedirectBaseUrl(request: Request): Promise<string> {
  const { origin } = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')

  // Determine the actual request origin
  const finalHost = forwardedHost || host
  let requestOrigin = origin
  if (finalHost) {
    const protocol =
      forwardedProto ||
      (process.env.NODE_ENV === 'development' ? 'http' : 'https')
    requestOrigin = normalizeBaseUrl(`${protocol}://${finalHost}`, origin)
  }

  // If NEXT_PUBLIC_SITE_URL is set, use it only if it matches the request origin
  // This allows dev servers to work correctly even if NEXT_PUBLIC_SITE_URL is set
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const envUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL, origin)
    // Only use env URL if it matches the request origin (same domain)
    // This prevents redirecting to production when on a dev/preview server
    const envUrlObj = new URL(envUrl)
    const requestUrlObj = new URL(requestOrigin)
    
    // If domains match, use env URL (allows for exact protocol/port matching)
    // Otherwise, use request origin (for dev/preview servers)
    if (envUrlObj.hostname === requestUrlObj.hostname) {
      return envUrl
    }
  }

  return requestOrigin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const baseUrl = await getRedirectBaseUrl(request)

  if (error) {
    const errorUrl = new URL('/auth', baseUrl)
    errorUrl.searchParams.set('error', error)
    return NextResponse.redirect(errorUrl)
  }

  const redirect = searchParams.get('redirect')
  const plan = searchParams.get('plan')
  const isAnnual = searchParams.get('isAnnual')

  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const errorMsg = exchangeError.message || 'Unknown error'
      const errorUrl = new URL('/auth', baseUrl)
      errorUrl.searchParams.set('error', errorMsg)
      return NextResponse.redirect(errorUrl)
    }

    if (redirect === 'pricing' && plan) {
      const params = new URLSearchParams({
        plan,
        ...(plan !== 'lifetime' && isAnnual && { isAnnual }),
      })
      const pricingUrl = new URL('/pricing', baseUrl)
      pricingUrl.searchParams.set('checkout', 'true')
      params.forEach((value, key) => pricingUrl.searchParams.set(key, value))
      return NextResponse.redirect(pricingUrl)
    }

    const nextUrl = new URL(next, baseUrl)
    return NextResponse.redirect(nextUrl)
  }

  const missingCodeUrl = new URL('/auth', baseUrl)
  missingCodeUrl.searchParams.set('error', 'no_code')
  return NextResponse.redirect(missingCodeUrl)
}


