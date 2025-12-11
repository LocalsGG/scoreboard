import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a client-side Supabase client for use in browser components.
 * It uses the public environment variables (NEXT_PUBLIC_...).
 * Ideal for: Realtime subscriptions and public reads.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
