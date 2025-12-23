'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/dates'

interface SubscriptionManagementProps {
  subscription: {
    plan_type: string | null
    status: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean | null
    stripe_subscription_id: string | null
  }
  onUpdate?: () => void
}

export function SubscriptionManagement({
  subscription,
  onUpdate,
}: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Don't show if plan_type is null, lifetime subscriptions, or base plan
  if (!subscription.plan_type || subscription.plan_type === 'lifetime' || subscription.plan_type === 'base') {
    return null
  }

  // Don't show if no subscription ID
  if (!subscription.stripe_subscription_id) {
    return null
  }

  const isCancelled = subscription.cancel_at_period_end === true
  const endDate = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null
  const hasEnded = endDate ? endDate < new Date() : false

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.')) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setSuccess('Your subscription has been cancelled. You will continue to have access until the end of your billing period.')
      if (onUpdate) {
        setTimeout(() => {
          onUpdate()
        }, 1000)
      } else {
        window.location.reload()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!confirm('Are you sure you want to reactivate your subscription?')) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }

      setSuccess('Your subscription has been reactivated.')
      if (onUpdate) {
        setTimeout(() => {
          onUpdate()
        }, 1000)
      } else {
        window.location.reload()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {endDate && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                {isCancelled ? 'Subscription Ends' : 'Next Billing Date'}
              </p>
              <p className="text-lg font-bold text-black">
                {formatDate(endDate.toISOString())}
              </p>
              {isCancelled && (
                <p className="text-sm text-zinc-600">
                  Your subscription will end on this date. You can reactivate it anytime before then.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">{success}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!isCancelled && !hasEnded && (
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors duration-150 ease-out hover:bg-red-50 hover:border-red-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
          </button>
        )}

        {isCancelled && !hasEnded && (
          <button
            onClick={handleReactivate}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)] transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Reactivating...' : 'Reactivate Subscription'}
          </button>
        )}

        {hasEnded && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm font-semibold text-yellow-800">
              Your subscription has ended. Please create a new subscription to continue using premium features.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
