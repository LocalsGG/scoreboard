import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "./types";

/**
 * Fetches user data from the public.users table
 * This includes subscription status and other user information
 */
export async function getUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle missing records gracefully

  if (error) {
    console.error("Error fetching user data:", error);
    return null;
  }

  return data as User | null;
}

/**
 * Ensures a user exists in the public.users table
 * This is needed because the scoreboards table may reference public.users
 * If the user doesn't exist, it will be created
 * First tries to use a database function (if available), then falls back to direct insert
 */
export async function ensureUserExists(
  supabase: SupabaseClient,
  userId: string,
  email: string | null
): Promise<{ success: boolean; error?: string }> {
  // First check if user already exists
  const existingUser = await getUserData(supabase, userId);
  if (existingUser) {
    return { success: true };
  }

  // Try to use the database function first (bypasses RLS with SECURITY DEFINER)
  const { error: rpcError } = await supabase.rpc("ensure_user_exists", {
    user_id: userId,
    user_email: email || "",
  });

  if (!rpcError) {
    return { success: true };
  }

  // If RPC function doesn't exist, fall back to direct insert
  // This requires the RLS policy "Users can insert their own record" to be set up
  if (rpcError.message.includes("function") && rpcError.message.includes("does not exist")) {
    console.warn("ensure_user_exists function not found, falling back to direct insert");
    
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: email || "",
        subscription_status: "base",
      });

    if (insertError) {
      // If it's an RLS error, provide helpful guidance
      if (insertError.message.includes("row-level security policy")) {
        return {
          success: false,
          error: "Database configuration issue. Please run the migration at /api/migrate-users to set up the required database functions and policies.",
        };
      }
      // If it's a conflict (user was created between check and insert), that's fine
      if (insertError.code === "23505") {
        return { success: true };
      }
      console.error("Error ensuring user exists:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  }

  // If RPC error is something else, return it
  console.error("Error calling ensure_user_exists function:", rpcError);
  return { success: false, error: rpcError.message };
}

/**
 * Updates user subscription status
 * 
 * SECURITY WARNING: This function should ONLY be called from:
 * - Payment webhook handlers (Stripe, etc.)
 * - Admin functions with proper authorization
 * - Server-side API routes with authentication checks
 * 
 * DO NOT expose this function to client-side code or user-facing API endpoints
 * without additional authorization checks. The RLS policy prevents users from
 * updating their own subscription_status, but this function bypasses that
 * when called with proper server credentials.
 */
export async function updateSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string,
  status: "base" | "standard" | "pro" | "lifetime"
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("users")
    .update({ subscription_status: status, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("Error updating subscription status:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Gets the board limit for a subscription status
 * Base: 1 board
 * Standard: 20 boards
 * Pro: 200 boards
 * Lifetime: 200 boards (same as Pro)
 */
export function getBoardLimit(subscriptionStatus: string | null | undefined): number {
  switch (subscriptionStatus) {
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
