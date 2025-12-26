import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { ScoreboardWithControls, UndoRedoControlsWrapper } from "@/components/ScoreboardWithControls";
import { ResetPositionsButton } from "@/components/ResetPositionsButton";
import { ScoreControlsPanel } from "@/components/ScoreControlsPanel";
import { LivestreamWrapper } from "@/components/LivestreamWrapper";
import { LivestreamLinkButton } from "@/components/LivestreamLinkButton";
import { ShareScorekeepingButton } from "@/components/ShareScorekeepingButton";
import { DisplayScoreboardButton } from "@/components/DisplayScoreboardButton";
import { ensureShareToken } from "@/lib/scoreboards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBaseUrlFromRequest } from "@/lib/urls";
import type { ElementPositions, ScoreboardType } from "@/lib/types";

export const dynamic = "force-dynamic";

type Scoreboard = {
  id: string;
  name: string | null;
  scoreboard_subtitle: string | null;
  created_at: string | null;
  share_token: string | null;
  owner_id?: string | null;
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
  livestream_url: string | null;
  livestream_enabled: boolean | null;
};

type LoadScoreboardResult = {
  board: Scoreboard | null;
  ownerName: string;
  isAuthenticated: boolean;
  isGuest: boolean;
  userId: string | null;
};

async function loadScoreboard(
  boardId: string
): Promise<LoadScoreboardResult> {
  if (!boardId) {
    notFound();
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      boardId
    );

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  
  const user = userData?.user;
  const isAuthenticated = !!user;
  const userId = user?.id || null;
  const isGuest = isAuthenticated && !user?.email;

  let ownerName = "you";

  if (isAuthenticated) {
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    ownerName =
      (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
      (typeof metadata.name === "string" && metadata.name.trim()) ||
      user.email ||
      "you";
  }

  if (boardId.startsWith("local-")) {
    return { board: null, ownerName, isAuthenticated, isGuest, userId };
  }

  let board: Scoreboard | null = null;
  let boardError: Error | null = null;
  
  try {
    let query = supabase
      .from("scoreboards")
      .select("id, name, scoreboard_subtitle, created_at, share_token, owner_id, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, element_positions, title_visible, a_side_icon, b_side_icon, center_text_color, custom_logo_url, scoreboard_type, livestream_url, livestream_enabled")
      .eq(isUuid ? "id" : "share_token", boardId);
    
    if (isAuthenticated && userId) {
      query = query.eq("owner_id", userId);
    }
    
    const result = await query.maybeSingle<Scoreboard>();
    
    if (result.error) {
      const errorMsg = result.error.message || '';
      if (errorMsg.includes("element_positions") || errorMsg.includes("column")) {
        let queryWithoutPos = supabase
          .from("scoreboards")
          .select("id, name, scoreboard_subtitle, created_at, share_token, owner_id, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, title_visible, center_text_color, custom_logo_url, scoreboard_type, livestream_url, livestream_enabled")
          .eq(isUuid ? "id" : "share_token", boardId);
        
        if (isAuthenticated && userId) {
          queryWithoutPos = queryWithoutPos.eq("owner_id", userId);
        }
        
        const resultWithoutPos = await queryWithoutPos.maybeSingle<Omit<Scoreboard, "element_positions" | "a_side_icon" | "b_side_icon"> & { element_positions?: null; a_side_icon?: null; b_side_icon?: null }>();
        
        if (resultWithoutPos.error) {
          boardError = new Error(resultWithoutPos.error.message || 'Unknown error');
        } else {
          board = { 
            ...resultWithoutPos.data, 
            element_positions: null, 
            title_visible: resultWithoutPos.data?.title_visible ?? true,
            a_side_icon: null,
            b_side_icon: null,
          } as Scoreboard;
        }
      } else {
        boardError = new Error(errorMsg);
      }
    } else {
      board = result.data;
    }
  } catch (err) {
    boardError = err instanceof Error ? err : new Error("Unknown error");
  }

  if (boardError) {
    throw new Error(boardError.message);
  }

  if (!board) {
    return { board: null, ownerName, isAuthenticated, isGuest, userId };
  }

  if (board.owner_id === null && isAuthenticated && !isGuest && userId) {
    const { error: claimError } = await supabase
      .from("scoreboards")
      .update({ owner_id: userId })
      .eq("id", board.id)
      .is("owner_id", null);

    if (!claimError) {
      board.owner_id = userId;
    }
  }

  if (isAuthenticated && !isGuest && userId && board.owner_id === userId) {
    try {
      const shareToken = await ensureShareToken({
        supabase,
        boardId: board.id,
        ownerId: userId,
        existingToken: board.share_token,
      });
      board.share_token = shareToken;
    } catch (error) {
      console.error("Failed to ensure share token:", error);
    }
  }

  return { board, ownerName, isAuthenticated, isGuest, userId };
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }
): Promise<Metadata> {
  const { id } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const { board } = await loadScoreboard(id);
  
  if (!board) {
    return {
      title: "Scoreboard Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const boardName = board.name || "Untitled Scoreboard";
  const description = board.scoreboard_subtitle 
    ? `${boardName} - ${board.scoreboard_subtitle} | Edit your live scoreboard overlay on Scoreboardtools`
    : `Edit ${boardName} - Live scoreboard overlay editor on Scoreboardtools`;

  return {
    title: boardName,
    description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ScoreboardPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const { board, isAuthenticated, isGuest, userId } = await loadScoreboard(id);

  if (!board) {
    return (
      <div className="flex min-h-full justify-center px-6 py-16 font-sans">
        <main className="w-full max-w-3xl space-y-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
            Scoreboard
          </p>
          <h1 className="text-3xl font-extrabold text-black">
            Board not found or you don&apos;t have access.
          </h1>
          <p className="text-sm text-black">
            Double-check the link or open it from your dashboard.
          </p>
          <div className="flex justify-center">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="rounded-md border border-black/20 px-4 py-2 text-sm font-semibold text-black transition hover:border-black/40 hover:bg-white"
              >
                Back to dashboard
              </Link>
            ) : (
              <Link
                href="/auth"
                className="rounded-md border border-black/20 px-4 py-2 text-sm font-semibold text-black transition hover:border-black/40 hover:bg-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </main>
      </div>
    );
  }

  const isOwner = userId && board.owner_id === userId;
  const canEdit = Boolean(isAuthenticated && !isGuest && isOwner);
  const authRedirect = `/auth?redirect=${encodeURIComponent(`/scoreboard/${id}`)}`;
  
  const baseUrl = await getBaseUrlFromRequest();
  const sharePath = board.share_token ? `/share/${board.share_token}` : null;
  const shareUrl = sharePath
    ? baseUrl
      ? `${baseUrl}${sharePath}`
      : sharePath
    : null;
  const controlsSharePath = board.share_token ? `/share-controls/${board.share_token}` : null;
  const controlsShareUrl = controlsSharePath
    ? baseUrl
      ? `${baseUrl}${controlsSharePath}`
      : controlsSharePath
    : null;

  return (
    <div className="relative flex min-h-full justify-center px-4 sm:px-6 py-6 sm:py-8 lg:py-12 font-sans">
      <main className="relative w-full max-w-6xl space-y-6 sm:space-y-8 lg:space-y-10 animate-fade-in">
        <header className="flex items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:text-zinc-700 transition-colors whitespace-nowrap"
              >
                <span aria-hidden="true">←</span>
                <span className="hidden sm:inline">Back to dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:text-zinc-700 transition-colors whitespace-nowrap"
              >
                <span aria-hidden="true">←</span>
                <span className="hidden sm:inline">Back to home</span>
                <span className="sm:hidden">Back</span>
              </Link>
            )}
            {canEdit ? (
              <>
                <div className="h-4 w-px bg-black/20" />
                <UndoRedoControlsWrapper />
                <div className="h-4 w-px bg-black/20" />
                <ResetPositionsButton boardId={board.id} compact={true} />
              </>
            ) : (
              <>
                <div className="h-4 w-px bg-black/20" />
                <Link
                  href={authRedirect}
                  className="inline-flex items-center gap-1.5 rounded-md border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-black transition hover:border-black/30 hover:bg-white"
                >
                  Sign in to edit
                </Link>
              </>
            )}
          </div>

          {isAuthenticated && !isGuest && (
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {shareUrl && (
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
              )}
              <div className="flex items-center gap-1 flex-shrink-0">
                {shareUrl && (
                  <>
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
                    <div className="h-4 w-px bg-black/20 mx-0.5" />
                  </>
                )}
                <LivestreamLinkButton
                  boardId={board.id}
                  initialUrl={board.livestream_url}
                  initialEnabled={board.livestream_enabled}
                  className="cursor-pointer rounded border border-black/20 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition-all duration-150 hover:border-black/40 hover:bg-white active:scale-95 whitespace-nowrap"
                />
              </div>
            </div>
          )}
        </header>

        <LivestreamWrapper
          boardId={board.id}
          initialLivestreamEnabled={board.livestream_enabled}
        >
          <div className="relative z-0 -my-4 sm:-my-6 lg:-my-8">
            <ScoreboardWithControls
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
              readOnly={!canEdit}
              isAuthenticated={isAuthenticated && !isGuest}
              livestreamEnabled={board.livestream_enabled}
            />
          </div>

          <section className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
            <ScoreControlsPanel
              boardId={board.id}
              initialLivestreamEnabled={board.livestream_enabled}
              isAuthenticated={isAuthenticated && !isGuest}
              name={board.name}
              scoreboardSubtitle={board.scoreboard_subtitle}
              aSide={board.a_side}
              bSide={board.b_side}
              aScore={board.a_score}
              bScore={board.b_score}
              scoreboardStyle={board.scoreboard_style}
              elementPositions={board.element_positions}
              titleVisible={board.title_visible}
              aSideIcon={board.a_side_icon}
              bSideIcon={board.b_side_icon}
              customLogoUrl={board.custom_logo_url}
              scoreboardType={board.scoreboard_type as ScoreboardType | null}
            />
          </section>
        </LivestreamWrapper>
      </main>
    </div>
  );
}
