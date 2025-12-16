import Stripe from 'stripe'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { updateSubscriptionStatus } from '@/lib/users'

type PaidPlanType = 'standard' | 'pro' | 'lifetime'

function getPlanTypeFromPriceId(priceId: string): PaidPlanType {
  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_ANNUAL
  ) {
    return 'pro'
  }

  if (priceId === process.env.STRIPE_PRICE_LIFETIME) return 'lifetime'

  return 'standard'
}

function getPaidPlanTypeFromMetadata(metadata: Stripe.Metadata | null | undefined): PaidPlanType | null {
  const raw = metadata?.subscription_status
  if (raw === 'standard' || raw === 'pro' || raw === 'lifetime') return raw
  return null
}

export async function syncSubscriptionFromCheckoutSessionId(params: {
  userId: string
  checkoutSessionId: string
}): Promise<{ success: boolean; error?: string }> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) return { success: false, error: 'Missing STRIPE_SECRET_KEY' }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' })
  const adminSupabase = createAdminSupabaseClient()

  let checkoutSession: Stripe.Checkout.Session
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(params.checkoutSessionId)
  } catch (error) {
    return { success: false, error: `Failed to retrieve checkout session: ${String(error)}` }
  }

  const sessionUserId = checkoutSession.metadata?.supabase_user_id
  if (sessionUserId && sessionUserId !== params.userId) {
    return { success: false, error: 'Checkout session does not belong to current user' }
  }

  const customerId = typeof checkoutSession.customer === 'string' ? checkoutSession.customer : null

  if (checkoutSession.mode === 'payment') {
    const priceId = checkoutSession.metadata?.price_id || process.env.STRIPE_PRICE_LIFETIME
    if (!priceId) return { success: false, error: 'Missing Stripe price id for payment checkout' }

    const planType =
      getPaidPlanTypeFromMetadata(checkoutSession.metadata) || getPlanTypeFromPriceId(priceId)

    const farFutureDate = new Date('2099-12-31T23:59:59Z')

    return await updateSubscriptionStatus(
      adminSupabase,
      params.userId,
      planType,
      null,
      priceId,
      customerId,
      'active',
      new Date(),
      farFutureDate,
      false
    )
  }

  const subscriptionId = typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : null
  if (!subscriptionId) return { success: false, error: 'Missing subscription id for subscription checkout' }

  let subscription: Stripe.Subscription
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    return { success: false, error: `Failed to retrieve subscription: ${String(error)}` }
  }

  const priceId = subscription.items.data[0]?.price.id
  if (!priceId) return { success: false, error: 'Missing price id on Stripe subscription' }

  const planType = getPaidPlanTypeFromMetadata(subscription.metadata) || getPlanTypeFromPriceId(priceId)

  return await updateSubscriptionStatus(
    adminSupabase,
    params.userId,
    planType,
    subscription.id,
    priceId,
    typeof subscription.customer === 'string' ? subscription.customer : customerId,
    subscription.status,
    subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
    subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
    subscription.cancel_at_period_end || false
  )
}


