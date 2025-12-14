import { notFound } from "next/navigation";
import { ScoreboardPreview } from "@/components/ScoreboardPreview";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SharedBoard = {
  id: string;
  name: string | null;
  created_at: string | null;
  a_side: string | null;
  b_side: string | null;
  a_score: number | null;
  b_score: number | null;
  updated_at: string | null;
};

async function loadSharedBoard(token: string) {
  if (!token) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  const { data: board, error: boardError } = await supabase
    .from("scoreboards")
    .select("id, name, created_at, a_side, b_side, a_score, b_score, updated_at")
    .eq("share_token", token)
    .maybeSingle<SharedBoard>();

  if (boardError) {
    throw new Error(boardError.message);
  }

  if (!board) {
    notFound();
  }

  return { board };
}

export default async function SharedScoreboardPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const { board } = await loadSharedBoard(token);

  return (
    <ScoreboardPreview
      boardId={board.id}
      initialName={board.name}
      initialASide={board.a_side}
      initialBSide={board.b_side}
      initialAScore={board.a_score}
      initialBScore={board.b_score}
      initialUpdatedAt={board.updated_at}
    />
  );
}
