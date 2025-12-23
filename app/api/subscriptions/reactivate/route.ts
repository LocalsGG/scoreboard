import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'
import { getUserSubscription } from '@/lib/users'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const subscription = await getUserSubscription(supabase, userId)

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Check if subscription is set to cancel at period end
    if (!subscription.cancel_at_period_end) {
      return NextResponse.json({
        success: true,
        message: 'Subscription is already active and not set to cancel',
      })
    }

    // Check if subscription has already ended
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end)
      const now = new Date()
      if (endDate < now) {
        return NextResponse.json(
          { error: 'Subscription has already ended. Please create a new subscription.' },
          { status: 400 }
        )
      }
    }

    const stripe = getStripeClient()
    
    // Reactivate the subscription by removing cancel_at_period_end
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    )

    // Update local database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
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
    console.error('Error reactivating subscription:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to reactivate subscription: ${errorMessage}` },
      { status: 500 }
    )
  }
}
