import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import 'server-only'

export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  const cookieStore = await cookies()

  const normalizeCookieOptions = (options?: CookieOptions) => {
    if (!options) return undefined
    const { sameSite, ...rest } = options
    const normalizedSameSite =
      typeof sameSite === 'boolean' ? (sameSite ? 'strict' : undefined) : sameSite

    return { ...rest, sameSite: normalizedSameSite } satisfies CookieOptions
  }

  return createServerClient(url, key, {
      cookies: {
        getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cookiesToSet) => {
          const writableCookies = cookieStore as unknown as {
            set?: (name: string, value: string, options?: CookieOptions) => void
          }

          if (typeof writableCookies.set !== 'function') return

          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              writableCookies.set!(name, value, normalizeCookieOptions(options))
            })
          } catch {
            // Safe to ignore: set can throw in server components.
          }
        },
      },
    }
  )
}
