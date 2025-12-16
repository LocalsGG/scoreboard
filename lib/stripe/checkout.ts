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

  // Create or retrieve Stripe customer
  const customerId = await getOrCreateCustomerId(supabase, userId, userEmail)

  // Determine subscription status based on price
  const subscriptionStatus = getPlanTypeFromPriceId(priceId)

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: priceId === process.env.STRIPE_PRICE_LIFETIME ? 'payment' : 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      client_reference_id: checkoutRequestId || undefined,
      metadata: {
        supabase_user_id: userId,
        subscription_status: subscriptionStatus,
        price_id: priceId,
        checkout_request_id: checkoutRequestId || undefined,
      },
      subscription_data:
        priceId !== process.env.STRIPE_PRICE_LIFETIME
          ? {
              metadata: {
                supabase_user_id: userId,
                subscription_status: subscriptionStatus,
                price_id: priceId,
                checkout_request_id: checkoutRequestId || undefined,
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

export async function getBaseUrl(request: Request): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')

  const finalHost = forwardedHost || host
  if (finalHost) {
    let protocol = 'https://'
    if (forwardedProto) {
      protocol = `${forwardedProto}://`
    } else if (process.env.NODE_ENV === 'development') {
      protocol = 'http://'
    }
    return `${protocol}${finalHost}`
  }

  const { origin } = new URL(request.url)
  return origin
}
