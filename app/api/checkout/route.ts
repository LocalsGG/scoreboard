import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createCheckoutSession, getBaseUrl } from '@/lib/stripe/checkout'
import { getValidPriceIds, validatePriceId } from '@/lib/stripe/config'

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
    const validation = validatePriceId(priceId)
    if (!validation.valid) {
      const validPriceIds = getValidPriceIds()
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
          hint: validation.error
        },
        { status: 400 }
      )
    }

    const baseUrl = await getBaseUrl(request)

    const rawCheckoutRequestId =
      request.headers.get('x-checkout-request-id') ||
      (typeof body?.checkoutRequestId === 'string' ? body.checkoutRequestId : null)

    // Create checkout session
    const { url } = await createCheckoutSession({
      supabase,
      userId: session.user.id,
      userEmail: session.user.email,
      priceId,
      baseUrl,
      checkoutRequestId: rawCheckoutRequestId,
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Checkout error:', error)
    
    // Log detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Checkout error details:', {
      message: errorMessage,
      stack: errorStack,
      envCheck: {
        hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
        stripeSecretPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
        hasPriceIds: {
          STANDARD_MONTHLY: !!process.env.STRIPE_PRICE_STANDARD_MONTHLY,
          STANDARD_ANNUAL: !!process.env.STRIPE_PRICE_STANDARD_ANNUAL,
          PRO_MONTHLY: !!process.env.STRIPE_PRICE_PRO_MONTHLY,
          PRO_ANNUAL: !!process.env.STRIPE_PRICE_PRO_ANNUAL,
          LIFETIME: !!process.env.STRIPE_PRICE_LIFETIME,
        },
      },
    })
    
    // Return more detailed error in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        ...(isDevelopment && { details: errorMessage }),
      },
      { status: 500 }
    )
  }
}
