import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a client-side Supabase client for use in browser components.
 * It uses the public environment variables (NEXT_PUBLIC_...).
 * Ideal for: Realtime subscriptions and public reads.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  return createBrowserClient(url, key)
}
