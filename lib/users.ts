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
): Promise<{ 
  plan_type: 'base' | 'standard' | 'pro' | 'lifetime' | null; 
  status: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string | null;
} | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan_type, status, stripe_subscription_id, stripe_price_id, stripe_customer_id, current_period_start, current_period_end, cancel_at_period_end, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { 
      plan_type: 'base', 
      status: null,
      stripe_subscription_id: null,
      stripe_price_id: null,
      stripe_customer_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: null,
      created_at: null,
    };
  }

  return data as { 
    plan_type: 'base' | 'standard' | 'pro' | 'lifetime' | null; 
    status: string | null;
    stripe_subscription_id: string | null;
    stripe_price_id: string | null;
    stripe_customer_id: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean | null;
    created_at: string | null;
  };
}

export async function ensureUserExists(
  supabase: SupabaseClient,
  userId: string,
  email: string | null
): Promise<{ success: boolean; error?: string }> {
  // Check if user already exists in profiles
  const existingUser = await getUserData(supabase, userId);
  if (existingUser) {
    return { success: true };
  }

  // Verify we have a valid user before attempting to create profile
  // This ensures the user exists in auth.users
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.id !== userId) {
    return { 
      success: false, 
      error: "Invalid session. Please sign in again." 
    };
  }

  // Try RPC function first if it exists (this is the preferred method)
  const rpcResult = await supabase.rpc("ensure_user_exists", {
    user_id: userId,
    user_email: email || "",
  }) as { data: unknown; error: { message?: string } | null };

  if (!rpcResult.error) {
    return { success: true };
  }

  const rpcErrorMsg = rpcResult.error.message || '';
  // If RPC doesn't exist, try direct insert
  if (rpcErrorMsg.includes("function") && rpcErrorMsg.includes("does not exist")) {
    // Try insert - user exists in auth.users since we have a valid session
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: email || "",
      });

    if (insertError) {
      // Unique constraint violation (23505) - user already exists (race condition)
      // This is actually success - the user exists now
      if (insertError.code === "23505") {
        return { success: true };
      }
      // Foreign key constraint violation (23503) - user doesn't exist in auth.users
      // This shouldn't happen if we verified the session, but handle it
      if (insertError.code === "23503") {
        return { 
          success: false, 
          error: "User authentication is invalid. Please sign in again." 
        };
      }
      // Log other errors for debugging
      console.error("Error inserting profile:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
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

  // One-time payments (lifetime) do not have a stripe_subscription_id.
  // Make this path idempotent: repeated webhook deliveries / redirect syncs should not create new rows.
  if (!stripeSubscriptionId && planType === 'lifetime') {
    const { data: existingLifetime, error: existingError } = await supabase
      .from("subscriptions")
      .select("id, status, stripe_customer_id, stripe_price_id")
      .eq("user_id", userId)
      .eq("plan_type", "lifetime")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: existingError.message || 'Unknown error' };
    }

    const matchesCustomer =
      !stripeCustomerId || existingLifetime?.stripe_customer_id === stripeCustomerId;
    const matchesPrice = !stripePriceId || existingLifetime?.stripe_price_id === stripePriceId;

    // If we already have an active lifetime row for this user, just update it (idempotent).
    if (existingLifetime && existingLifetime.status === 'active' && matchesCustomer && matchesPrice) {
      const { error } = await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingLifetime.id);

      if (error) {
        return { success: false, error: error.message || 'Unknown error' };
      }

      return { success: true };
    }

    // Deactivate any existing active subscriptions (standard/pro/etc.) before activating lifetime.
    const { error: deactivateError } = await supabase
      .from("subscriptions")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "active");

    if (deactivateError) {
      return { success: false, error: deactivateError.message || 'Unknown error' };
    }

    // Reuse an existing lifetime row if present; otherwise insert once.
    if (existingLifetime) {
      const { error } = await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingLifetime.id);

      if (error) {
        return { success: false, error: error.message || 'Unknown error' };
      }

      return { success: true };
    }

    const { error } = await supabase
      .from("subscriptions")
      .insert(subscriptionData);

    if (error) {
      // If a DB uniqueness constraint exists (recommended), a concurrent insert can race here.
      // Treat that as idempotent: fetch the existing row and update it.
      if ((error as { code?: string } | null)?.code === "23505") {
        const { data: racedLifetime, error: racedError } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("plan_type", "lifetime")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (racedError) {
          return { success: false, error: racedError.message || 'Unknown error' };
        }

        if (racedLifetime?.id) {
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update(subscriptionData)
            .eq("id", racedLifetime.id);

          if (updateError) {
            return { success: false, error: updateError.message || 'Unknown error' };
          }

          return { success: true };
        }
      }
      return { success: false, error: error.message || 'Unknown error' };
    }

    return { success: true };
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
        // If stripe_subscription_id is unique (recommended), a concurrent insert can race here.
        // Treat it as idempotent: re-fetch by stripe_subscription_id and update.
        if ((error as { code?: string } | null)?.code === "23505") {
          const { data: raced, error: racedError } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("user_id", userId)
            .eq("stripe_subscription_id", stripeSubscriptionId)
            .maybeSingle();

          if (racedError) {
            return { success: false, error: racedError.message || 'Unknown error' };
          }

          if (raced?.id) {
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update(subscriptionData)
              .eq("id", raced.id);

            if (updateError) {
              return { success: false, error: updateError.message || 'Unknown error' };
            }

            return { success: true };
          }
        }
        return { success: false, error: error.message || 'Unknown error' };
      }
    }
  } else {
    // For one-time payments (other) without subscription ID, just insert
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
