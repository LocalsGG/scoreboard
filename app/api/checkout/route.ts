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
    const validPriceIds = getValidPriceIds()
    const standardAnnualId = process.env.STRIPE_PRICE_STANDARD_ANNUAL
    
    // Compare with working standard annual for debugging
    console.log('Price ID validation:', {
      received: priceId,
      isValid: validation.valid,
      standardAnnualId, // Working example
      matchesStandardAnnual: priceId === standardAnnualId,
      validIds: validPriceIds,
      envVars: {
        STANDARD_MONTHLY: process.env.STRIPE_PRICE_STANDARD_MONTHLY,
        STANDARD_ANNUAL: process.env.STRIPE_PRICE_STANDARD_ANNUAL,
        PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
        PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
        LIFETIME: process.env.STRIPE_PRICE_LIFETIME,
      },
      envVarComparison: {
        STANDARD_ANNUAL: {
          value: process.env.STRIPE_PRICE_STANDARD_ANNUAL,
          matches: priceId === process.env.STRIPE_PRICE_STANDARD_ANNUAL,
          exists: !!process.env.STRIPE_PRICE_STANDARD_ANNUAL,
        },
        received: {
          value: priceId,
          inValidList: validPriceIds.includes(priceId),
        }
      }
    })
    
    if (!validation.valid) {
      console.error('Invalid price ID:', {
        received: priceId,
        receivedType: typeof priceId,
        receivedLength: priceId?.length,
        validIds: validPriceIds,
        standardAnnualId, // Working example for comparison
        envVars: {
          STANDARD_MONTHLY: process.env.STRIPE_PRICE_STANDARD_MONTHLY,
          STANDARD_ANNUAL: process.env.STRIPE_PRICE_STANDARD_ANNUAL,
          PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
          PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
          LIFETIME: process.env.STRIPE_PRICE_LIFETIME,
        },
        comparison: {
          matchesStandardAnnual: priceId === standardAnnualId,
          matchesStandardMonthly: priceId === process.env.STRIPE_PRICE_STANDARD_MONTHLY,
          matchesProAnnual: priceId === process.env.STRIPE_PRICE_PRO_ANNUAL,
          matchesProMonthly: priceId === process.env.STRIPE_PRICE_PRO_MONTHLY,
          matchesLifetime: priceId === process.env.STRIPE_PRICE_LIFETIME,
        }
      })
      return NextResponse.json(
        { 
          error: 'Invalid price ID',
          received: priceId,
          hint: validation.error,
          // Include working example for comparison
          workingExample: standardAnnualId,
          validIds: validPriceIds,
          debug: {
            receivedPriceId: priceId,
            receivedType: typeof priceId,
            validPriceIdsCount: validPriceIds.length,
            envVarsSet: {
              STANDARD_MONTHLY: !!process.env.STRIPE_PRICE_STANDARD_MONTHLY,
              STANDARD_ANNUAL: !!process.env.STRIPE_PRICE_STANDARD_ANNUAL,
              PRO_MONTHLY: !!process.env.STRIPE_PRICE_PRO_MONTHLY,
              PRO_ANNUAL: !!process.env.STRIPE_PRICE_PRO_ANNUAL,
              LIFETIME: !!process.env.STRIPE_PRICE_LIFETIME,
            },
            comparison: {
              matchesStandardAnnual: priceId === standardAnnualId,
              matchesStandardMonthly: priceId === process.env.STRIPE_PRICE_STANDARD_MONTHLY,
              matchesProAnnual: priceId === process.env.STRIPE_PRICE_PRO_ANNUAL,
              matchesProMonthly: priceId === process.env.STRIPE_PRICE_PRO_MONTHLY,
              matchesLifetime: priceId === process.env.STRIPE_PRICE_LIFETIME,
            }
          }
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
    
    // Return error details (but sanitize sensitive info)
    // Don't sanitize too much - we need to see the actual error in production
    const sanitizedError = errorMessage.includes('STRIPE_SECRET_KEY') 
      ? 'Stripe secret key is missing or invalid'
      : errorMessage // Show the actual error message for debugging
    
    return NextResponse.json(
      { 
        error: sanitizedError,
        // Include environment check info to help debug
        debug: {
          hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
          stripeKeyType: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 
                         process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'unknown',
          hasPriceIds: {
            STANDARD_MONTHLY: !!process.env.STRIPE_PRICE_STANDARD_MONTHLY,
            STANDARD_ANNUAL: !!process.env.STRIPE_PRICE_STANDARD_ANNUAL,
            PRO_MONTHLY: !!process.env.STRIPE_PRICE_PRO_MONTHLY,
            PRO_ANNUAL: !!process.env.STRIPE_PRICE_PRO_ANNUAL,
            LIFETIME: !!process.env.STRIPE_PRICE_LIFETIME,
          },
        },
      },
      { status: 500 }
    )
  }
}
