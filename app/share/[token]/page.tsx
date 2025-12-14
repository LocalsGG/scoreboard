import { notFound } from "next/navigation";
import { ScoreboardPreview } from "@/components/ScoreboardPreview";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ElementPositions } from "@/lib/types";

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
  scoreboard_style: string | null;
  element_positions: ElementPositions | null;
};

async function loadSharedBoard(token: string) {
  if (!token) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  // Select all columns, but handle element_positions gracefully if it doesn't exist
  let board: SharedBoard | null = null;
  let boardError: Error | null = null;
  
  try {
    const result = await supabase
      .from("scoreboards")
      .select("id, name, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, element_positions")
      .eq("share_token", token)
      .maybeSingle<SharedBoard>();
    
    if (result.error) {
      // If error is about missing column, try without it
      if (result.error.message?.includes("element_positions") || result.error.message?.includes("column")) {
        const resultWithoutPos = await supabase
          .from("scoreboards")
          .select("id, name, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style")
          .eq("share_token", token)
          .maybeSingle<Omit<SharedBoard, "element_positions"> & { element_positions?: null }>();
        
        if (resultWithoutPos.error) {
          boardError = new Error(resultWithoutPos.error.message);
        } else {
          board = { ...resultWithoutPos.data, element_positions: null } as SharedBoard;
        }
      } else {
        boardError = new Error(result.error.message);
      }
    } else {
      board = result.data;
    }
  } catch (err) {
    boardError = err instanceof Error ? err : new Error("Unknown error");
  }

  if (boardError) {
    throw boardError;
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
      initialStyle={board.scoreboard_style}
      initialPositions={board.element_positions}
      readOnly={true}
    />
  );
}
