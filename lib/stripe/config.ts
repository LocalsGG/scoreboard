export type PaidPlanType = 'standard' | 'pro' | 'lifetime'

export function getValidPriceIds(): string[] {
  return [
    process.env.STRIPE_PRICE_STANDARD_MONTHLY,
    process.env.STRIPE_PRICE_STANDARD_ANNUAL,
    process.env.STRIPE_PRICE_PRO_MONTHLY,
    process.env.STRIPE_PRICE_PRO_ANNUAL,
    process.env.STRIPE_PRICE_LIFETIME,
  ].filter((id): id is string => Boolean(id))
}

export function validatePriceId(priceId: string): { valid: boolean; error?: string } {
  const validPriceIds = getValidPriceIds()
  
  if (!validPriceIds.includes(priceId)) {
    return {
      valid: false,
      error: `Invalid price ID. Make sure STRIPE_PRICE_* env vars use price IDs (price_...) not product IDs (prod_...)`,
    }
  }
  
  return { valid: true }
}

export function getPlanTypeFromPriceId(priceId: string): PaidPlanType {
  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_ANNUAL
  ) {
    return 'pro'
  }

  if (priceId === process.env.STRIPE_PRICE_LIFETIME) {
    return 'lifetime'
  }

  return 'standard'
}

export function getPaidPlanTypeFromMetadata(
  metadata: Record<string, string> | null | undefined
): PaidPlanType | null {
  const raw = metadata?.subscription_status
  if (raw === 'standard' || raw === 'pro' || raw === 'lifetime') {
    return raw
  }
  return null
}

