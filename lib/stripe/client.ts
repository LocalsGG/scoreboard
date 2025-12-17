import Stripe from 'stripe'

export function getStripeClient(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })
}

export function getWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
  }
  return webhookSecret
}

