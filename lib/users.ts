import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "./types";

export async function getUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as User | null;
}

export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<{ plan_type: 'base' | 'standard' | 'pro' | 'lifetime' | null; status: string | null } | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan_type, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { plan_type: 'base', status: null };
  }

  return data as { plan_type: 'base' | 'standard' | 'pro' | 'lifetime' | null; status: string | null };
}

export async function ensureUserExists(
  supabase: SupabaseClient,
  userId: string,
  email: string | null
): Promise<{ success: boolean; error?: string }> {
  const existingUser = await getUserData(supabase, userId);
  if (existingUser) {
    return { success: true };
  }

  const rpcResult = await supabase.rpc("ensure_user_exists", {
    user_id: userId,
    user_email: email || "",
  }) as { data: unknown; error: { message?: string } | null };

  if (!rpcResult.error) {
    return { success: true };
  }

  const rpcErrorMsg = rpcResult.error.message || '';
  if (rpcErrorMsg.includes("function") && rpcErrorMsg.includes("does not exist")) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: email || "",
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return { success: true };
      }
      return { success: false, error: insertError.message || 'Unknown error' };
    }

    return { success: true };
  }

  return { success: false, error: rpcErrorMsg };
}

export async function updateSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string,
  planType: "base" | "standard" | "pro" | "lifetime",
  stripeSubscriptionId?: string | null,
  stripePriceId?: string | null,
  stripeCustomerId?: string | null,
  subscriptionStatus?: string,
  currentPeriodStart?: Date | string | null,
  currentPeriodEnd?: Date | string | null,
  cancelAtPeriodEnd?: boolean
): Promise<{ success: boolean; error?: string }> {
  // If planType is 'base', deactivate all subscriptions
  if (planType === 'base') {
    const { error } = await supabase
      .from("subscriptions")
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      return { success: false, error: error.message || 'Unknown error' };
    }
    return { success: true };
  }

  // For paid plans, upsert the subscription
  const subscriptionData: {
    user_id: string;
    plan_type: string;
    status: string;
    stripe_subscription_id?: string | null;
    stripe_price_id?: string | null;
    stripe_customer_id?: string | null;
    current_period_start?: string | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
    updated_at: string;
  } = {
    user_id: userId,
    plan_type: planType,
    status: subscriptionStatus || 'active',
    updated_at: new Date().toISOString(),
  };

  if (stripeSubscriptionId) {
    subscriptionData.stripe_subscription_id = stripeSubscriptionId;
  }
  if (stripePriceId) {
    subscriptionData.stripe_price_id = stripePriceId;
  }
  if (stripeCustomerId) {
    subscriptionData.stripe_customer_id = stripeCustomerId;
  }
  if (currentPeriodStart) {
    subscriptionData.current_period_start = currentPeriodStart instanceof Date 
      ? currentPeriodStart.toISOString() 
      : currentPeriodStart;
  }
  if (currentPeriodEnd) {
    subscriptionData.current_period_end = currentPeriodEnd instanceof Date 
      ? currentPeriodEnd.toISOString() 
      : currentPeriodEnd;
  }
  if (cancelAtPeriodEnd !== undefined) {
    subscriptionData.cancel_at_period_end = cancelAtPeriodEnd;
  }

  // First, deactivate any existing active subscriptions
  await supabase
    .from("subscriptions")
    .update({ 
      status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId)
    .eq("status", "active");

  // Then insert the new subscription
  // For subscriptions with stripe_subscription_id, check if it exists and update, otherwise insert
  if (stripeSubscriptionId) {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle();

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existing.id);

      if (error) {
        return { success: false, error: error.message || 'Unknown error' };
      }
    } else {
      // Insert new subscription
      const { error } = await supabase
        .from("subscriptions")
        .insert(subscriptionData);

      if (error) {
        return { success: false, error: error.message || 'Unknown error' };
      }
    }
  } else {
    // For one-time payments (lifetime) without subscription ID, just insert
    const { error } = await supabase
      .from("subscriptions")
      .insert(subscriptionData);

    if (error) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  return { success: true };
}

export function getBoardLimit(planType: string | null | undefined): number {
  switch (planType) {
    case "standard":
      return 20;
    case "pro":
    case "lifetime":
      return 200;
    case "base":
    default:
      return 1;
  }
}
