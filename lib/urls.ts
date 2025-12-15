import { headers } from 'next/headers'

/**
 * Gets the base URL for the site, working in both local and production environments.
 * 
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL environment variable (if set)
 * 2. Origin header from the request (for server components)
 * 3. window.location.origin (for client components)
 * 
 * For local development: Use http://localhost:3000 (or don't set NEXT_PUBLIC_SITE_URL)
 * For production: Set NEXT_PUBLIC_SITE_URL=https://scoreboard.locals.gg
 */
export async function getSiteUrl(): Promise<string> {
  // First, check if NEXT_PUBLIC_SITE_URL is set
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    return envUrl.replace(/\/$/, '') // Remove trailing slash
  }

  // For server components, try to get origin from headers
  try {
    const headersList = await headers()
    const origin = headersList.get('origin') || headersList.get('host')
    if (origin) {
      // If origin is just a host (no protocol), add https for production
      if (origin.startsWith('http://') || origin.startsWith('https://')) {
        return origin
      }
      // In production, assume https; in development, use http
      const protocol = process.env.NODE_ENV === 'production' ? 'https://' : 'http://'
      return `${protocol}${origin}`
    }
  } catch {
    // Headers might not be available in all contexts
  }

  // Fallback for client-side or when headers aren't available
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Last resort fallback
  return ''
}

/**
 * Gets the site URL synchronously (for client components only).
 * This should only be used in client components where window is available.
 */
export function getSiteUrlSync(): string {
  // First, check if NEXT_PUBLIC_SITE_URL is set
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    return envUrl.replace(/\/$/, '') // Remove trailing slash
  }

  // For client components, use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

/**
 * Gets the base URL from request headers (server-side only).
 * This is useful for API routes and server components.
 */
export async function getBaseUrlFromRequest(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const forwardedHost = headersList.get('x-forwarded-host')
    const forwardedProto = headersList.get('x-forwarded-proto')
    
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
  } catch {
    // Headers might not be available
  }

  return ''
}
