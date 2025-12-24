import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'
import { getUserSubscription } from '@/lib/users'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const subscription = await getUserSubscription(supabase, userId)

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Lifetime subscriptions cannot be cancelled
    if (subscription.plan_type === 'lifetime') {
      return NextResponse.json(
        { error: 'Lifetime subscriptions cannot be cancelled' },
        { status: 400 }
      )
    }

    // If already cancelled, return success
    if (subscription.cancel_at_period_end) {
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription is already set to cancel at period end' 
      })
    }

    const stripe = getStripeClient()
    
    // Cancel the subscription at period end
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    )

    // Update local database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('stripe_subscription_id', subscription.stripe_subscription_id)

    if (updateError) {
      console.error('Error updating subscription in database:', updateError)
      // Still return success since Stripe was updated
    }

    return NextResponse.json({
      success: true,
      subscription: {
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: updatedSubscription.current_period_end
          ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
          : null,
      },
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to cancel subscription: ${errorMessage}` },
      { status: 500 }
    )
  }
}


