import { notFound } from "next/navigation";
import { ScoreboardPreview } from "@/components/ScoreboardPreview";
import { BoardNameEditor } from "@/components/BoardNameEditor";
import { BoardSubtitleEditor } from "@/components/BoardSubtitleEditor";
import { ScoreAdjuster } from "@/components/ScoreAdjuster";
import { SideNameEditor } from "@/components/SideNameEditor";
import { CompactStyleSelector } from "@/components/CompactStyleSelector";
import { ResetPositionsButton } from "@/components/ResetPositionsButton";
import { CharacterIconSelector } from "@/components/CharacterIconSelector";
import { LogoSelector } from "@/components/LogoSelector";
import { GameTypeIndicator } from "@/components/GameTypeIndicator";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ElementPositions, ScoreboardType } from "@/lib/types";

export const dynamic = "force-dynamic";

type SharedBoard = {
  id: string;
  name: string | null;
  scoreboard_subtitle: string | null;
  created_at: string | null;
  a_side: string | null;
  b_side: string | null;
  a_score: number | null;
  b_score: number | null;
  updated_at: string | null;
  scoreboard_style: string | null;
  element_positions: ElementPositions | null;
  title_visible: boolean | null;
  a_side_icon: string | null;
  b_side_icon: string | null;
  center_text_color: string | null;
  custom_logo_url: string | null;
  scoreboard_type: string | null;
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
      .select("id, name, scoreboard_subtitle, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, element_positions, title_visible, a_side_icon, b_side_icon, center_text_color, custom_logo_url, scoreboard_type")
      .eq("share_token", token)
      .maybeSingle<SharedBoard>();
    
    if (result.error) {
      // If error is about missing column, try without it
      if (result.error.message?.includes("element_positions") || result.error.message?.includes("column")) {
        const resultWithoutPos = await supabase
          .from("scoreboards")
          .select("id, name, scoreboard_subtitle, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, title_visible, center_text_color, custom_logo_url, scoreboard_type")
          .eq("share_token", token)
          .maybeSingle<Omit<SharedBoard, "element_positions" | "a_side_icon" | "b_side_icon"> & { element_positions?: null; a_side_icon?: null; b_side_icon?: null }>();
        
        if (resultWithoutPos.error) {
          boardError = new Error(resultWithoutPos.error.message);
        } else {
          board = { 
            ...resultWithoutPos.data, 
            element_positions: null, 
            title_visible: resultWithoutPos.data?.title_visible ?? true,
            a_side_icon: null,
            b_side_icon: null,
          } as SharedBoard;
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
            initialSubtitle={board.scoreboard_subtitle}
            initialASide={board.a_side}
            initialBSide={board.b_side}
            initialAScore={board.a_score}
            initialBScore={board.b_score}
            initialUpdatedAt={board.updated_at}
            initialStyle={board.scoreboard_style}
            initialPositions={board.element_positions}
            initialTitleVisible={board.title_visible}
            initialASideIcon={board.a_side_icon}
            initialBSideIcon={board.b_side_icon}
            initialCenterTextColor={board.center_text_color}
            initialCustomLogoUrl={board.custom_logo_url}
            initialScoreboardType={board.scoreboard_type as "melee" | "ultimate" | "guilty-gear" | "generic" | null}
          />
        </div>

        <section className="space-y-6 sm:space-y-8">
          {/* Score Controls - Single Panel */}
          <div className="rounded-2xl border border-black/5 bg-white/80 p-4 sm:p-6 lg:p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)] relative">
            <div className="space-y-6">
              {/* Scoreboard Name - Centered above logo */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-md">
                  <BoardNameEditor 
                    boardId={board.id} 
                    initialName={board.name} 
                    initialTitleVisible={board.title_visible ?? true}
                    initialCustomLogoUrl={board.custom_logo_url}
                    align="center" 
                    showLabel={false}
                    initialPositions={board.element_positions}
                  />
                </div>
              </div>

              {/* Top Row: A Side Name | A Side Score | Logo | B Side Score | B Side Name */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-3 items-start">
                {/* A Side Name */}
                <div className="space-y-2 min-w-0">
                  <div className="flex items-start gap-2">
                    {(board.scoreboard_type === "melee" || board.scoreboard_type === "ultimate") && (
                      <CharacterIconSelector
                        boardId={board.id}
                        initialValue={board.a_side_icon}
                        column="a_side_icon"
                        placeholder="Select character icon"
                        compact={true}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <SideNameEditor
                        boardId={board.id}
                        initialValue={board.a_side}
                        column="a_side"
                        placeholder="A Side Name"
                        initialPositions={board.element_positions}
                      />
                    </div>
                  </div>
                </div>

                {/* A Side Score */}
                <div className="space-y-2 min-w-0">
                  <ScoreAdjuster boardId={board.id} column="a_score" initialValue={board.a_score} initialPositions={board.element_positions} />
                </div>

                {/* Logo */}
                <div className="space-y-2 flex flex-col items-center min-w-0">
                  <LogoSelector
                    boardId={board.id}
                    initialCustomLogoUrl={board.custom_logo_url}
                    initialScoreboardType={board.scoreboard_type as ScoreboardType | null}
                    initialPositions={board.element_positions}
                  />
                </div>

                {/* B Side Score */}
                <div className="space-y-2 min-w-0">
                  <ScoreAdjuster boardId={board.id} column="b_score" initialValue={board.b_score} initialPositions={board.element_positions} />
                </div>

                {/* B Side Name */}
                <div className="space-y-2 min-w-0">
                  <div className="flex items-start gap-2">
                    {(board.scoreboard_type === "melee" || board.scoreboard_type === "ultimate") && (
                      <CharacterIconSelector
                        boardId={board.id}
                        initialValue={board.b_side_icon}
                        column="b_side_icon"
                        placeholder="Select character icon"
                        compact={true}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <SideNameEditor
                        boardId={board.id}
                        initialValue={board.b_side}
                        column="b_side"
                        placeholder="B Side Name"
                        initialPositions={board.element_positions}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Style Selector, Subtitle, and Game Type */}
              <div className="grid grid-cols-3 items-end gap-4">
                <div className="flex justify-start">
                  <CompactStyleSelector boardId={board.id} initialStyle={board.scoreboard_style} />
                </div>
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-full max-w-[200px]">
                    <BoardSubtitleEditor
                      boardId={board.id}
                      initialValue={board.scoreboard_subtitle}
                      placeholder="Subtitle"
                      align="center"
                      initialPositions={board.element_positions}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <GameTypeIndicator 
                    boardId={board.id} 
                    initialType={board.scoreboard_type as ScoreboardType | null} 
                  />
                </div>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}


