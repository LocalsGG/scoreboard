import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getStripeClient } from './client'

export async function getOrCreateCustomerId(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined
): Promise<string> {
  const stripe = getStripeClient()

  // Check if user already has a Stripe customer ID stored
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: {
      supabase_user_id: userId,
    },
  })

  // Store customer ID in Supabase
  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

export async function retrieveCustomer(
  customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  const stripe = getStripeClient()
  return await stripe.customers.retrieve(customerId)
}
