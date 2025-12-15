import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

async function getBaseUrl(request: Request): Promise<string> {
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

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Validate price ID matches our expected prices
    const validPriceIds = [
      process.env.STRIPE_PRICE_STANDARD_MONTHLY,
      process.env.STRIPE_PRICE_STANDARD_ANNUAL,
      process.env.STRIPE_PRICE_PRO_MONTHLY,
      process.env.STRIPE_PRICE_PRO_ANNUAL,
      process.env.STRIPE_PRICE_LIFETIME,
    ].filter(Boolean) // Remove undefined values

    if (!validPriceIds.includes(priceId)) {
      console.error('Invalid price ID:', {
        received: priceId,
        validIds: validPriceIds,
        envVars: {
          STANDARD_MONTHLY: process.env.STRIPE_PRICE_STANDARD_MONTHLY,
          STANDARD_ANNUAL: process.env.STRIPE_PRICE_STANDARD_ANNUAL,
          PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
          PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
          LIFETIME: process.env.STRIPE_PRICE_LIFETIME,
        }
      })
      return NextResponse.json(
        { 
          error: 'Invalid price ID',
          received: priceId,
          hint: 'Make sure STRIPE_PRICE_* env vars use price IDs (price_...) not product IDs (prod_...)'
        },
        { status: 400 }
      )
    }

    const baseUrl = await getBaseUrl(request)

    const rawCheckoutRequestId =
      request.headers.get('x-checkout-request-id') ||
      (typeof body?.checkoutRequestId === 'string' ? body.checkoutRequestId : null)

    // Create or retrieve Stripe customer
    let customerId: string | undefined

    // Check if user already has a Stripe customer ID stored
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        metadata: {
          supabase_user_id: session.user.id,
        },
      })
      customerId = customer.id

      // Store customer ID in Supabase
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id)
    }

    // Determine subscription status based on price
    let subscriptionStatus: 'standard' | 'pro' | 'lifetime' = 'standard'
    if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || 
        priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
      subscriptionStatus = 'pro'
    } else if (priceId === process.env.STRIPE_PRICE_LIFETIME) {
      subscriptionStatus = 'lifetime'
    } else if (priceId === process.env.STRIPE_PRICE_STANDARD_MONTHLY ||
               priceId === process.env.STRIPE_PRICE_STANDARD_ANNUAL) {
      subscriptionStatus = 'standard'
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
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
      client_reference_id: rawCheckoutRequestId || undefined,
      metadata: {
        supabase_user_id: session.user.id,
        subscription_status: subscriptionStatus,
        price_id: priceId,
        checkout_request_id: rawCheckoutRequestId || undefined,
      },
      subscription_data: priceId !== process.env.STRIPE_PRICE_LIFETIME ? {
        metadata: {
          supabase_user_id: session.user.id,
          subscription_status: subscriptionStatus,
          price_id: priceId,
          checkout_request_id: rawCheckoutRequestId || undefined,
        },
      } : undefined,
    }, {
      // Guarantees we don't create multiple checkout sessions for the same "click"
      // (retries, double-submits, StrictMode dev effects, etc.)
      idempotencyKey: (() => {
        if (rawCheckoutRequestId) return `checkout:${rawCheckoutRequestId}`
        const timeBucket = Math.floor(Date.now() / (5 * 60 * 1000)) // 5-min bucket
        return `checkout:fallback:${session.user.id}:${priceId}:${timeBucket}`
      })(),
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
