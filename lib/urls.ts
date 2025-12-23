import { headers } from 'next/headers'

/**
 * Gets the base URL for the site, working in both local and production environments.
 * 
 * Priority:
 * 1. Request origin from headers (for server components) - prioritized to support dev/preview servers
 * 2. NEXT_PUBLIC_SITE_URL environment variable (if it matches the request origin)
 * 3. window.location.origin (for client components)
 * 
 * This ensures that:
 * - http://localhost:3000 works for local development
 * - https://devserver-dev--scoreboardlive.netlify.app/ works for preview deployments
 * - https://scoreboard.locals.gg works for production
 */
export async function getSiteUrl(): Promise<string> {
  // For server components, try to get origin from headers first
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const forwardedHost = headersList.get('x-forwarded-host')
    const forwardedProto = headersList.get('x-forwarded-proto')
    const origin = headersList.get('origin')
    
    let requestOrigin = ''
    if (origin) {
      requestOrigin = origin
    } else {
      const finalHost = forwardedHost || host
      if (finalHost) {
        const protocol = forwardedProto 
          ? `${forwardedProto}://`
          : (process.env.NODE_ENV === 'production' ? 'https://' : 'http://')
        requestOrigin = `${protocol}${finalHost}`
      }
    }

    if (requestOrigin) {
      // If NEXT_PUBLIC_SITE_URL is set, use it only if it matches the request origin
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        const envUrl = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
        try {
          const envUrlObj = new URL(envUrl)
          const requestUrlObj = new URL(requestOrigin)
          
          // If domains match, use env URL (allows for exact protocol/port matching)
          // Otherwise, use request origin (for dev/preview servers)
          if (envUrlObj.hostname === requestUrlObj.hostname) {
            return envUrl
          }
        } catch {
          // If URL parsing fails, use request origin
        }
      }
      
      return requestOrigin
    }
  } catch {
    // Headers might not be available in all contexts
  }

  // Fallback for client-side or when headers aren't available
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Last resort: use env URL if set
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }

  // Default to production domain for SEO
  return 'https://scoreboardtools.com'
}

/**
 * Normalizes a base URL string, ensuring it has a protocol and returns the origin.
 * Used internally by URL utility functions.
 */
export function normalizeBaseUrl(url: string | null | undefined, fallbackOrigin: string): string {
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

/**
 * Gets the base URL from request headers (server-side only).
 * This is useful for API routes and server components.
 * 
 * This function prioritizes the actual request origin over NEXT_PUBLIC_SITE_URL
 * to ensure dev/preview servers work correctly.
 */
export async function getBaseUrlFromRequest(): Promise<string> {
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const forwardedHost = headersList.get('x-forwarded-host')
    const forwardedProto = headersList.get('x-forwarded-proto')
    
    const finalHost = forwardedHost || host
    let requestOrigin = ''
    
    if (finalHost) {
      // Determine protocol
      const protocol = forwardedProto 
        ? `${forwardedProto}://`
        : (process.env.NODE_ENV === 'development' ? 'http://' : 'https://')
      requestOrigin = normalizeBaseUrl(`${protocol}${finalHost}`, '')
    }

    // If NEXT_PUBLIC_SITE_URL is set, use it only if it matches the request origin
    // This allows dev servers to work correctly even if NEXT_PUBLIC_SITE_URL is set
    if (process.env.NEXT_PUBLIC_SITE_URL && requestOrigin) {
      const envUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL, '')
      const envUrlObj = new URL(envUrl)
      const requestUrlObj = new URL(requestOrigin)
      
      // If domains match, use env URL (allows for exact protocol/port matching)
      // Otherwise, use request origin (for dev/preview servers)
      if (envUrlObj.hostname === requestUrlObj.hostname) {
        return envUrl
      }
    }

    if (requestOrigin) {
      return requestOrigin
    }

    // Fallback to env URL if no request origin available
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL, '')
    }
  } catch {
    // Headers might not be available
  }

  return ''
}


