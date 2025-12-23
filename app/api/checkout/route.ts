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
      console.error('Invalid price ID:', {
        received: priceId,
        hint: validation.error,
      })
      return NextResponse.json(
        { 
          error: 'Invalid price ID',
          hint: validation.error,
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Checkout error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // Sanitize sensitive information
    const sanitizedError = errorMessage.includes('STRIPE_SECRET_KEY') 
      ? 'Stripe secret key is missing or invalid'
      : errorMessage
    
    return NextResponse.json(
      { error: sanitizedError },
      { status: 500 }
    )
  }
}
