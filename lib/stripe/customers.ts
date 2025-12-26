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

  try {
    // Ensure user profile exists before querying/updating
    const userCheck = await ensureUserExists(supabase, userId, email || null)
    if (!userCheck.success) {
      console.error('Error ensuring user exists:', {
        userId,
        email,
        error: userCheck.error,
      })
      throw new Error(`Failed to ensure user profile exists: ${userCheck.error}`)
    }

    // Check if user already has a Stripe customer ID stored in subscriptions
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      console.error('Error fetching subscription:', {
        userId,
        error: subscriptionError,
        code: subscriptionError.code,
        message: subscriptionError.message,
        details: subscriptionError.details,
        hint: subscriptionError.hint,
      })
      // Don't throw here, continue to create new customer
    }

    if (subscription?.stripe_customer_id) {
      // Verify the customer actually exists in Stripe
      // It might have been deleted or belong to a different Stripe account/environment
      try {
        const existingCustomer = await stripe.customers.retrieve(subscription.stripe_customer_id)
        
        // If customer exists and is not deleted, return it
        if (existingCustomer && !existingCustomer.deleted) {
          return subscription.stripe_customer_id
        }
        
        // Customer was deleted, log and continue to create a new one
        console.warn('Stored Stripe customer was deleted, creating new one:', {
          userId,
          deletedCustomerId: subscription.stripe_customer_id,
        })
      } catch (error) {
        // Customer doesn't exist (404) or other error
        const errorMessage = error instanceof Error ? error.message : String(error)
        const stripeError = error as { type?: string; code?: string; message?: string }
        
        // If it's a "No such customer" error, create a new one
        if (stripeError.code === 'resource_missing' || errorMessage.includes('No such customer')) {
          console.warn('Stored Stripe customer does not exist, creating new one:', {
            userId,
            invalidCustomerId: subscription.stripe_customer_id,
            error: errorMessage,
          })
        } else {
          // Some other error occurred, log it but still try to create a new customer
          console.error('Error verifying Stripe customer, will create new one:', {
            userId,
            customerId: subscription.stripe_customer_id,
            error: errorMessage,
            stripeErrorCode: stripeError.code,
          })
        }
      }
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
      const stripeError = error as { type?: string; code?: string; param?: string; message?: string }
      console.error('Error creating Stripe customer:', {
        userId,
        email,
        error: errorMessage,
        stripeErrorType: stripeError.type,
        stripeErrorCode: stripeError.code,
        stripeErrorParam: stripeError.param,
      })
      throw new Error(`Failed to create Stripe customer: ${errorMessage}`)
    }

    // Store customer ID in subscriptions table
    // First, try to update existing subscription
    const { data: existingSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('id')
      .limit(1)

    if (updateError) {
      console.error('Error updating subscription with Stripe customer ID:', {
        userId,
        customerId: customer.id,
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      })
      // Still return the customer ID since Stripe customer was created successfully
      // The customer ID will be stored on next attempt or via webhook
    }

    // If no subscription exists, create a new one with base plan
    if (!existingSubscription || existingSubscription.length === 0) {
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_customer_id: customer.id,
          plan_type: 'base',
          status: 'active',
          updated_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error creating subscription with Stripe customer ID:', {
          userId,
          customerId: customer.id,
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        })
        // Still return the customer ID since Stripe customer was created successfully
        // The customer ID will be stored on next attempt or via webhook
      }
    }

    return customer.id
  } catch (error) {
    // Re-throw with more context
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('getOrCreateCustomerId failed:', {
      userId,
      email,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

export async function retrieveCustomer(
  customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  const stripe = getStripeClient()
  return await stripe.customers.retrieve(customerId)
}

