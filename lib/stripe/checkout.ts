import { getStripeClient } from './client'
import { validatePriceId, getPlanTypeFromPriceId } from './config'
import { getOrCreateCustomerId } from './customers'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface CreateCheckoutSessionParams {
  supabase: SupabaseClient
  userId: string
  userEmail: string | null | undefined
  priceId: string
  baseUrl: string
  checkoutRequestId?: string | null
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ url: string | null }> {
  const { supabase, userId, userEmail, priceId, baseUrl, checkoutRequestId } = params

  // Validate price ID
  const validation = validatePriceId(priceId)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid price ID')
  }

  const stripe = getStripeClient()

  // Retrieve the price to determine if it's recurring or one-time
  const price = await stripe.prices.retrieve(priceId)
  const isRecurring = price.type === 'recurring'

  // Create or retrieve Stripe customer
  const customerId = await getOrCreateCustomerId(supabase, userId, userEmail)

  // Determine subscription status based on price
  const subscriptionStatus = getPlanTypeFromPriceId(priceId)

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: isRecurring ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      client_reference_id: checkoutRequestId || undefined,
      metadata: {
        supabase_user_id: userId,
        subscription_status: subscriptionStatus,
        price_id: priceId,
        checkout_request_id: checkoutRequestId || null,
      },
      subscription_data:
        isRecurring
          ? {
              metadata: {
                supabase_user_id: userId,
                subscription_status: subscriptionStatus,
                price_id: priceId,
                checkout_request_id: checkoutRequestId || null,
              },
            }
          : undefined,
    },
    {
      // Guarantees we don't create multiple checkout sessions for the same "click"
      // (retries, double-submits, StrictMode dev effects, etc.)
      idempotencyKey: (() => {
        if (checkoutRequestId) return `checkout:${checkoutRequestId}`
        const timeBucket = Math.floor(Date.now() / (5 * 60 * 1000)) // 5-min bucket
        return `checkout:fallback:${userId}:${priceId}:${timeBucket}`
      })(),
    }
  )

  return { url: checkoutSession.url }
}

function normalizeBaseUrl(url: string | null | undefined, fallbackOrigin: string): string {
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

export async function getBaseUrl(request: Request): Promise<string> {
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
