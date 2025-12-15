import { notFound } from "next/navigation";
import { ScoreboardPreview } from "@/components/ScoreboardPreview";
import { BoardNameEditor } from "@/components/BoardNameEditor";
import { ScoreAdjuster } from "@/components/ScoreAdjuster";
import { SideNameEditor } from "@/components/SideNameEditor";
import { ResetPositionsButton } from "@/components/ResetPositionsButton";
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

export default async function SharedControlsPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const { board } = await loadSharedBoard(token);

  return (
    <div className="relative flex min-h-full justify-center px-4 sm:px-6 py-6 sm:py-8 lg:py-12 font-sans">
      <main className="relative w-full max-w-6xl space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
        <div className="relative z-0 -my-8 sm:-my-12 lg:-my-16">
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
          />
        </div>

        <section className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-black/5 bg-white/80 p-4 sm:p-6 lg:p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)] animate-rise">
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            <div className="space-y-4 rounded-2xl border border-black/8 bg-white/80 p-4 sm:p-5 shadow-sm shadow-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                A side
              </p>
              <SideNameEditor
                boardId={board.id}
                initialValue={board.a_side}
                column="a_side"
                placeholder="A Side"
              />
              <ScoreAdjuster boardId={board.id} column="a_score" initialValue={board.a_score} />
            </div>

            <div className="space-y-4 rounded-2xl border border-black/8 bg-white/80 p-4 sm:p-5 text-center shadow-sm shadow-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                Scoreboard name
              </p>
              <BoardNameEditor boardId={board.id} initialName={board.name} align="center" />
              <ResetPositionsButton boardId={board.id} />
            </div>

            <div className="space-y-4 rounded-2xl border border-black/8 bg-white/80 p-4 sm:p-5 shadow-sm shadow-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                B side
              </p>
              <SideNameEditor
                boardId={board.id}
                initialValue={board.b_side}
                column="b_side"
                placeholder="B Side"
              />
              <ScoreAdjuster boardId={board.id} column="b_score" initialValue={board.b_score} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
