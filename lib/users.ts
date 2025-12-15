import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "./types";

export async function getUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as User | null;
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
      .from("users")
      .insert({
        id: userId,
        email: email || "",
        subscription_status: "base",
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
  status: "base" | "standard" | "pro" | "lifetime"
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("users")
    .update({ subscription_status: status, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message || 'Unknown error' };
  }

  return { success: true };
}

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
