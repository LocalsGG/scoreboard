import Stripe from 'stripe'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getStripeClient, getWebhookSecret } from './client'
import { getPlanTypeFromPriceId, getPaidPlanTypeFromMetadata, type PaidPlanType } from './config'

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient()
  const webhookSecret = getWebhookSecret()
  
  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}

export async function resolveSupabaseUserIdFromStripe(params: {
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

export function getPlanTypeFromSubscription(
  subscription: Stripe.Subscription,
  fallbackPriceId?: string
): PaidPlanType {
  const priceId = subscription.items.data[0]?.price.id || fallbackPriceId
  if (!priceId) {
    throw new Error('Missing price id on Stripe subscription')
  }
  return getPaidPlanTypeFromMetadata(subscription.metadata) || getPlanTypeFromPriceId(priceId)
}

export function getPlanTypeFromCheckoutSession(
  session: Stripe.Checkout.Session,
  fallbackPriceId?: string
): PaidPlanType {
  const priceId = (session.metadata?.price_id as string | undefined) || fallbackPriceId
  if (!priceId) {
    throw new Error('Missing price id on checkout session')
  }
  return getPaidPlanTypeFromMetadata(session.metadata) || getPlanTypeFromPriceId(priceId)
}
