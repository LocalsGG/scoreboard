import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScoreboardRow, User } from "./types";

type Supabase = SupabaseClient;

export interface ScoreboardWithOwner extends ScoreboardRow {
  owner?: User | null;
}

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

export async function regenerateShareToken(params: ShareTokenParams) {
  return saveShareToken(params);
}

/**
 * Fetches scoreboards with owner information (email, subscription_status)
 * Uses the owner_id foreign key relationship to join with users table
 */
export async function getScoreboardsWithOwner(
  supabase: Supabase,
  userId: string
): Promise<ScoreboardWithOwner[]> {
  const { data, error } = await supabase
    .from("scoreboards")
    .select(`
      *,
      owner:users!scoreboards_owner_id_fkey (
        id,
        email,
        subscription_status,
        created_at,
        updated_at
      )
    `)
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((board) => ({
    ...board,
    owner: Array.isArray(board.owner) ? board.owner[0] : board.owner,
  })) as ScoreboardWithOwner[];
}
