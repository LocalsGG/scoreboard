import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supabase = SupabaseClient;

export function createShareToken() {
  return randomUUID().replace(/-/g, "");
}

type ShareTokenParams = {
  supabase: Supabase;
  boardId: string;
  ownerId: string;
};

async function saveShareToken({ supabase, boardId, ownerId }: ShareTokenParams) {
  const newToken = createShareToken();
  const { data, error } = await supabase
    .from("scoreboards")
    .update({ share_token: newToken })
    .eq("id", boardId)
    .eq("owner_id", ownerId)
    .select("share_token")
    .maybeSingle<{ share_token: string | null }>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.share_token ?? newToken;
}

export async function ensureShareToken(
  params: ShareTokenParams & { existingToken?: string | null }
) {
  if (params.existingToken) return params.existingToken;
  return saveShareToken(params);
}
