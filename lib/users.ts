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
    .single();

  if (error) {
    console.error("Error fetching user data:", error);
    return null;
  }

  return data as User;
}

/**
 * Updates user subscription status
 */
export async function updateSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string,
  status: "base" | "pro" | "enterprise"
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
