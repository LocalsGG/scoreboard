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

    // Check if user already has a Stripe customer ID stored
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', {
        userId,
        error: profileError,
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      })
      throw new Error(`Failed to fetch user profile: ${profileError.message || profileError.code || 'Unknown error'}`)
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
      console.log('Successfully created Stripe customer:', customer.id)
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

    // Store customer ID in Supabase
    // Try update first (most common case)
    // Use .select() to check if any rows were actually updated
    const { data: updatedRows, error: updateError, count } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId)
      .select('id')

    // Check if update actually modified any rows
    // Supabase returns error: null even when 0 rows are updated
    const rowsUpdated = (updatedRows && updatedRows.length > 0) || (count !== null && count > 0)

    if (updateError || !rowsUpdated) {
      // If update failed OR no rows were updated, try upsert
      // This handles the case where profile doesn't exist despite ensureUserExists
      const reason = updateError 
        ? `Update error: ${updateError.message}` 
        : 'No rows updated (profile may not exist)'
      
      console.warn('Update failed or no rows updated, trying upsert:', {
        userId,
        reason,
        updateError: updateError?.message,
        updateErrorCode: updateError?.code,
        rowsUpdated,
        updatedRowsCount: updatedRows?.length || 0,
        count,
      })
      
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
        console.error('Error upserting profile with Stripe customer ID:', {
          userId,
          customerId: customer.id,
          error: upsertError,
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
        })
        // If both update and upsert fail, this is likely an RLS policy issue
        // But we still return the customer ID since Stripe customer was created successfully
        // The customer ID will be stored on next attempt or via webhook
      } else {
        console.log('Successfully upserted Stripe customer ID in profile')
      }
    } else {
      console.log('Successfully updated Stripe customer ID in profile', {
        rowsUpdated: updatedRows?.length || count,
      })
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
