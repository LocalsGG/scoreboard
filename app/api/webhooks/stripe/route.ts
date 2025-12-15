import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { updateSubscriptionStatus } from '@/lib/users'

type PaidPlanType = 'standard' | 'pro' | 'lifetime'

function getPlanTypeFromPriceId(priceId: string): PaidPlanType {
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || 
      priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
    return 'pro'
  } else if (priceId === process.env.STRIPE_PRICE_LIFETIME) {
    return 'lifetime'
  } else {
    return 'standard'
  }
}

function getPaidPlanTypeFromMetadata(metadata: Stripe.Metadata | null | undefined): PaidPlanType | null {
  const raw = metadata?.subscription_status
  if (raw === 'standard' || raw === 'pro' || raw === 'lifetime') {
    return raw
  }
  return null
}

async function resolveSupabaseUserIdFromStripe(params: {
  supabase: ReturnType<typeof createAdminSupabaseClient>
  stripe: Stripe
  checkoutSession?: Stripe.Checkout.Session
  subscription?: Stripe.Subscription
  customerId?: string | null
}): Promise<string | null> {
  const { supabase, stripe, checkoutSession, subscription, customerId } = params

  const sessionUserId = checkoutSession?.metadata?.supabase_user_id
  if (sessionUserId) return sessionUserId

  const subscriptionUserId = subscription?.metadata?.supabase_user_id
  if (subscriptionUserId) return subscriptionUserId

  const resolvedCustomerId =
    customerId ||
    (typeof subscription?.customer === 'string' ? subscription.customer : null) ||
    (typeof checkoutSession?.customer === 'string' ? checkoutSession.customer : null) ||
    null

  if (!resolvedCustomerId) return null

  try {
    const customer = await stripe.customers.retrieve(resolvedCustomerId)
    if (!('deleted' in customer) && customer.metadata?.supabase_user_id) {
      const userId = customer.metadata.supabase_user_id
      // Best-effort: keep profiles.stripe_customer_id in sync.
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: resolvedCustomerId })
        .eq('id', userId)
      return userId
    }
  } catch (error) {
    console.error('Failed to retrieve customer for user resolution:', error)
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', resolvedCustomerId)
    .maybeSingle()

  if (error) {
    console.error('Failed to resolve profile by stripe_customer_id:', error)
    return null
  }

  return profile?.id ?? null
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createAdminSupabaseClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Handle both subscription and one-time payment
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          const userId = await resolveSupabaseUserIdFromStripe({
            supabase,
            stripe,
            checkoutSession: session,
            subscription,
          })
          const priceId = subscription.items.data[0]?.price.id
          
          if (userId && priceId) {
            const planType = getPaidPlanTypeFromMetadata(subscription.metadata) || getPlanTypeFromPriceId(priceId)
            const customerId = subscription.customer as string
            
            await updateSubscriptionStatus(
              supabase, 
              userId, 
              planType,
              subscription.id,
              priceId,
              customerId,
              subscription.status,
              subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
              subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
              subscription.cancel_at_period_end || false
            )
          }
        } else if (session.mode === 'payment') {
          // Handle one-time payment (lifetime deal)
          const userId = await resolveSupabaseUserIdFromStripe({
            supabase,
            stripe,
            checkoutSession: session,
          })
          const priceId = (session.metadata?.price_id as string | undefined) || process.env.STRIPE_PRICE_LIFETIME
          
          if (userId && priceId) {
            const planType = getPaidPlanTypeFromMetadata(session.metadata) || getPlanTypeFromPriceId(priceId)
            const customerId = session.customer as string
            
            // For lifetime/one-time payments, set a far future end date
            const farFutureDate = new Date('2099-12-31T23:59:59Z')
            
            await updateSubscriptionStatus(
              supabase, 
              userId, 
              planType,
              null, // No subscription ID for one-time payments
              priceId,
              customerId,
              'active',
              new Date(), // Start date is now
              farFutureDate, // End date is far future for lifetime
              false // Never cancel at period end for lifetime
            )
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()

        const userId =
          subRecord?.user_id ||
          (await resolveSupabaseUserIdFromStripe({
            supabase,
            stripe,
            subscription,
            customerId: typeof subscription.customer === 'string' ? subscription.customer : null,
          }))

        if (userId) {
          if (event.type === 'customer.subscription.deleted' || 
              subscription.status === 'canceled' || 
              subscription.status === 'unpaid') {
            // Downgrade to base if subscription is canceled
            await updateSubscriptionStatus(supabase, userId, 'base')
          } else {
            // Upsert subscription row for any non-canceled status
            const priceId = subscription.items.data[0]?.price.id
            if (priceId) {
              const planType = getPaidPlanTypeFromMetadata(subscription.metadata) || getPlanTypeFromPriceId(priceId)
              const customerId = subscription.customer as string
              
              await updateSubscriptionStatus(
                supabase, 
                userId, 
                planType,
                subscription.id,
                priceId,
                customerId,
                subscription.status,
                subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
                subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
                subscription.cancel_at_period_end || false
              )
            }
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          
          const { data: subRecord } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle()

          const userId =
            subRecord?.user_id ||
            (await resolveSupabaseUserIdFromStripe({
              supabase,
              stripe,
              subscription,
              customerId: typeof subscription.customer === 'string' ? subscription.customer : null,
            }))

          if (userId) {
            const priceId = subscription.items.data[0]?.price.id
            if (!priceId) break

            const planType = getPaidPlanTypeFromMetadata(subscription.metadata) || getPlanTypeFromPriceId(priceId)
            const customerId = subscription.customer as string

            await updateSubscriptionStatus(
              supabase, 
              userId, 
              planType,
              subscription.id,
              priceId,
              customerId,
              subscription.status,
              subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
              subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
              subscription.cancel_at_period_end || false
            )
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          
          const { data: subRecord } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (subRecord) {
            // Optionally downgrade or keep subscription but mark as unpaid
            // For now, we'll keep the subscription status but you might want to handle this differently
            console.log(`Payment failed for user ${subRecord.user_id}, subscription ${subscription.id}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
