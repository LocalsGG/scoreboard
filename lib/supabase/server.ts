import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import 'server-only'

/**
 * Creates a secure, authenticated Supabase client for Server Components and Server Actions.
 * It reads the user's session from the request cookies to enable RLS checks.
 * * We call 'cookies()' directly inside the accessor methods to preserve context,
 * which resolves the critical '...get is not a function' TypeError.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  const normalizeCookieOptions = (options?: CookieOptions) => {
    if (!options) return undefined
    const { sameSite, ...rest } = options
    const normalizedSameSite =
      typeof sameSite === 'boolean' ? (sameSite ? 'strict' : undefined) : sameSite

    return { ...rest, sameSite: normalizedSameSite } satisfies CookieOptions
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
