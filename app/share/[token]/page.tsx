import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreboardPreview } from "@/components/ScoreboardPreview";
import { CopyButton } from "@/components/CopyButton";
import { DisplayScoreboardButton } from "@/components/DisplayScoreboardButton";
import { ShareScorekeepingButton } from "@/components/ShareScorekeepingButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSiteUrl, getBaseUrlFromRequest } from "@/lib/urls";
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
  livestream_enabled: boolean | null;
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
      .select("id, name, scoreboard_subtitle, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, element_positions, title_visible, a_side_icon, b_side_icon, center_text_color, custom_logo_url, scoreboard_type, livestream_enabled")
      .eq("share_token", token)
      .maybeSingle<SharedBoard>();
    
    if (result.error) {
      console.error("Error loading shared board:", result.error);
      // If error is about missing column, try without it
      if (result.error.message?.includes("element_positions") || result.error.message?.includes("column")) {
        const resultWithoutPos = await supabase
          .from("scoreboards")
          .select("id, name, scoreboard_subtitle, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, title_visible, center_text_color, custom_logo_url, scoreboard_type, livestream_enabled")
          .eq("share_token", token)
          .maybeSingle<Omit<SharedBoard, "element_positions" | "a_side_icon" | "b_side_icon"> & { element_positions?: null; a_side_icon?: null; b_side_icon?: null }>();
        
        if (resultWithoutPos.error) {
          console.error("Error loading shared board (without positions):", resultWithoutPos.error);
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
    console.error("Exception loading shared board:", err);
    boardError = err instanceof Error ? err : new Error("Unknown error");
  }

  if (boardError) {
    console.error("Board error for token:", token, boardError);
    throw boardError;
  }

  if (!board) {
    console.error("Board not found for token:", token);
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

  const siteUrl = await getSiteUrl() || "https://scoreboardtools.com";
  const shareUrl = `${siteUrl}/share/${token}`;

  const boardName = board.name || "Live Scoreboard";
  const description = board.scoreboard_subtitle 
    ? `${boardName} - ${board.scoreboard_subtitle} | Live scoreboard overlay on Scoreboardtools`
    : `${boardName} - Live scoreboard overlay on Scoreboardtools`;

  return {
    title: boardName,
    description,
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title: boardName,
      description,
      type: "website",
      url: shareUrl,
      siteName: "Scoreboardtools",
    },
    twitter: {
      card: "summary_large_image",
      title: boardName,
      description,
    },
  };
}

export default async function SharedScoreboardPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const { board } = await loadSharedBoard(token);

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  const isAuthenticated = !!user;
  const isGuest = isAuthenticated && !user?.email;

  const baseUrl = await getBaseUrlFromRequest();
  const sharePath = `/share/${token}`;
  const shareUrl = baseUrl ? `${baseUrl}${sharePath}` : sharePath;
  const controlsSharePath = `/share-controls/${token}`;
  const controlsShareUrl = baseUrl ? `${baseUrl}${controlsSharePath}` : controlsSharePath;

  return (
    <div className="relative flex min-h-full justify-center px-4 sm:px-6 py-6 sm:py-8 lg:py-12 font-sans">
      <main className="relative w-full max-w-6xl space-y-6 sm:space-y-8 lg:space-y-10 animate-fade-in">
        {/* Header with Share Controls */}
        {isAuthenticated && !isGuest && (
          <header className="flex items-center gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  readOnly
                  value={shareUrl}
                  className="w-full truncate rounded-lg border border-black/15 bg-white px-3 py-1.5 pr-24 text-xs font-semibold text-black shadow-inner shadow-black/5"
                />
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center z-10">
                  <CopyButton
                    value={shareUrl}
                    label="Copy Link"
                    showIcon={false}
                    className="cursor-pointer rounded border border-black/20 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition-all duration-150 hover:border-black/40 hover:bg-white active:scale-95 whitespace-nowrap"
                  />
                </div>
              </div>
              
              {/* Buttons to the right of link bar */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <DisplayScoreboardButton
                  shareUrl={shareUrl}
                  className="cursor-pointer inline-flex items-center justify-center rounded border border-black/20 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition-all duration-150 hover:border-black/40 hover:bg-white active:scale-95 whitespace-nowrap"
                />
                {controlsShareUrl && (
                  <>
                    <div className="h-4 w-px bg-black/20 mx-0.5" />
                    <ShareScorekeepingButton
                      shareUrl={controlsShareUrl}
                      livestreamEnabled={board.livestream_enabled ?? false}
                      boardId={board.id}
                      className="cursor-pointer rounded border border-black/20 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition-all duration-150 hover:border-black/40 hover:bg-white active:scale-95 whitespace-nowrap"
                    />
                  </>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Scoreboard Preview */}
        <div className="relative z-0 -my-4 sm:-my-6 lg:-my-8">
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
          />
        </div>
      </main>
    </div>
  );
}
