import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ScoreboardPreview } from "@/components/ScoreboardPreview";
import { ScoreAdjuster } from "@/components/ScoreAdjuster";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ElementPositions } from "@/lib/types";

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
  owner_id: string | null;
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
      .select("id, name, scoreboard_subtitle, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, element_positions, title_visible, a_side_icon, b_side_icon, center_text_color, custom_logo_url, scoreboard_type, owner_id")
      .eq("share_token", token)
      .maybeSingle<SharedBoard>();
    
    if (result.error) {
      // If error is about missing column, try without it
      if (result.error.message?.includes("element_positions") || result.error.message?.includes("column")) {
        const resultWithoutPos = await supabase
          .from("scoreboards")
          .select("id, name, scoreboard_subtitle, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, title_visible, center_text_color, custom_logo_url, scoreboard_type, owner_id")
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

export async function generateMetadata(
  props: { params: Promise<{ token: string }> }
): Promise<Metadata> {
  const { token } = await props.params;
  const { board } = await loadSharedBoard(token);
  
  if (!board) {
    return {
      title: "Scoreboard Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const boardName = board.name || "Scoreboard Controls";
  const description = `Control ${boardName} - Edit your live scoreboard overlay on Scoreboardtools`;

  return {
    title: `${boardName} - Controls`,
    description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SharedControlsPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect(`/auth?redirect=${encodeURIComponent(`/share-controls/${token}`)}`);
  }

  const { board } = await loadSharedBoard(token);

  if (!board.owner_id) {
    await supabase
      .from("scoreboards")
      .update({ owner_id: user.id })
      .eq("id", board.id)
      .is("owner_id", null);
    board.owner_id = user.id;
  }

  return (
    <div className="relative flex min-h-full justify-center px-4 sm:px-6 py-6 sm:py-8 lg:py-12 font-sans">
      <main className="relative w-full max-w-6xl space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Scoreboard Preview - Read-only, mirrors main preview */}
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
            readOnly={true}
            isAuthenticated={true}
          />
        </div>

        {/* Score Controls Only */}
        <section className="space-y-6 sm:space-y-8">
          <div className="rounded-2xl border border-black/5 bg-white/80 p-4 sm:p-6 lg:p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)] relative">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black text-center">
                Score Controls
              </h2>
              <p className="text-sm text-black/60 text-center">
                Adjust the scores below. All other settings are controlled by the main scoreboard.
              </p>
              
              {/* Score Controls - Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto">
                {/* A Side Score */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-black/70">
                    {board.a_side || "A Side"} Score
                  </label>
                  <ScoreAdjuster 
                    boardId={board.id} 
                    column="a_score" 
                    initialValue={board.a_score} 
                    initialPositions={board.element_positions}
                    isAuthenticated={true}
                  />
                </div>

                {/* B Side Score */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-black/70">
                    {board.b_side || "B Side"} Score
                  </label>
                  <ScoreAdjuster 
                    boardId={board.id} 
                    column="b_score" 
                    initialValue={board.b_score} 
                    initialPositions={board.element_positions}
                    isAuthenticated={true}
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


