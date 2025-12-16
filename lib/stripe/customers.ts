import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getStripeClient } from './client'
import { ensureUserExists } from '../users'

export async function getOrCreateCustomerId(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined
): Promise<string> {
  const stripe = getStripeClient()

  // Ensure user profile exists before querying/updating
  const userCheck = await ensureUserExists(supabase, userId, email || null)
  if (!userCheck.success) {
    console.error('Error ensuring user exists:', userCheck.error)
    throw new Error(`Failed to ensure user profile exists: ${userCheck.error}`)
  }

  // Check if user already has a Stripe customer ID stored
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    throw new Error(`Failed to fetch user profile: ${profileError.message}`)
  }

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  // Create new Stripe customer
  let customer
  try {
    customer = await stripe.customers.create({
      email: email || undefined,
      metadata: {
        supabase_user_id: userId,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error creating Stripe customer:', errorMessage)
    throw new Error(`Failed to create Stripe customer: ${errorMessage}`)
  }

  // Store customer ID in Supabase using upsert to handle both insert and update
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: email || null,
        stripe_customer_id: customer.id,
      },
      {
        onConflict: 'id',
      }
    )

  if (upsertError) {
    console.error('Error upserting profile with Stripe customer ID:', upsertError)
    // Don't throw here - customer was created successfully, we can continue
    // The customer ID will be stored on next attempt
  }

  return customer.id
}

export async function retrieveCustomer(
  customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  const stripe = getStripeClient()
  return await stripe.customers.retrieve(customerId)
}
