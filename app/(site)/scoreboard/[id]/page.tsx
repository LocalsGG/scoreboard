import { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { BoardNameEditor } from "@/components/BoardNameEditor";
import { BoardSubtitleEditor } from "@/components/BoardSubtitleEditor";
import { ScoreAdjuster } from "@/components/ScoreAdjuster";
import { SideNameEditor } from "@/components/SideNameEditor";
import { ScoreboardWithControls, UndoRedoControlsWrapper } from "@/components/ScoreboardWithControls";
import { CompactStyleSelector } from "@/components/CompactStyleSelector";
import { SaveStatusIndicator } from "@/components/SaveStatusIndicator";
import { ResetPositionsButton } from "@/components/ResetPositionsButton";
import { CharacterIconSelector } from "@/components/CharacterIconSelector";
import { LogoSelector } from "@/components/LogoSelector";
import { GameTypeIndicator } from "@/components/GameTypeIndicator";
import { ensureShareToken, createShareToken } from "@/lib/scoreboards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBaseUrlFromRequest } from "@/lib/urls";
import { getUserSubscription } from "@/lib/users";
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
};

type LoadScoreboardResult = {
  board: Scoreboard | null;
  ownerName: string;
  hasPaidSubscription: boolean;
};

async function loadScoreboard(boardId: string): Promise<LoadScoreboardResult> {
  if (!boardId) {
    notFound();
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      boardId
    );

  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  // Handle authentication errors - if user doesn't exist, redirect to auth
  if (userError) {
    const errorMsg = userError.message || '';
    if (errorMsg.includes('does not exist') || errorMsg.includes('JWT')) {
      redirect("/auth");
    }
    throw new Error(errorMsg);
  }
  const user = userData.user;

  // Require authenticated user with email
  if (!user || !user.email) {
    redirect("/auth");
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const ownerName =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    user.email ||
    "you";

  // Fetch user subscription status
  const subscription = await getUserSubscription(supabase, user.id);
  const planType = subscription?.plan_type || "base";
  const hasPaidSubscription = planType === "pro" || planType === "standard" || planType === "lifetime";

  // Select all columns, but handle element_positions gracefully if it doesn't exist
  let board: Scoreboard | null = null;
  let boardError: Error | null = null;
  
  try {
    const result = await supabase
      .from("scoreboards")
      .select("id, name, scoreboard_subtitle, created_at, share_token, owner_id, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, element_positions, title_visible, a_side_icon, b_side_icon, center_text_color, custom_logo_url, scoreboard_type")
      .eq(isUuid ? "id" : "share_token", boardId)
      .eq("owner_id", user.id)
      .maybeSingle<Scoreboard>();
    
    if (result.error) {
      const errorMsg = result.error.message || '';
      if (errorMsg.includes("element_positions") || errorMsg.includes("column")) {
        // Try without element_positions and icon columns
        const resultWithoutPos = await supabase
          .from("scoreboards")
          .select("id, name, scoreboard_subtitle, created_at, share_token, owner_id, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, title_visible, center_text_color, custom_logo_url, scoreboard_type")
          .eq(isUuid ? "id" : "share_token", boardId)
          .eq("owner_id", user.id)
          .maybeSingle<Omit<Scoreboard, "element_positions" | "a_side_icon" | "b_side_icon"> & { element_positions?: null; a_side_icon?: null; b_side_icon?: null }>();
        
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
    return { board: null, ownerName, hasPaidSubscription };
  }

  // Ensure a share token exists for this board while keeping the logic in one place.
  const shareToken = await ensureShareToken({
    supabase,
    boardId: board.id,
    ownerId: user.id,
    existingToken: board.share_token,
  });

  board.share_token = shareToken;

  return { board, ownerName, hasPaidSubscription };
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params;
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

async function generateShareToken(formData: FormData) {
  "use server";

  const boardId = (formData.get("boardId") as string | null) ?? "";

  if (!boardId) {
    throw new Error("Missing board id");
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // Handle authentication errors - if user doesn't exist, redirect to auth
  if (userError) {
    const errorMsg = userError.message || '';
    if (errorMsg.includes('does not exist') || errorMsg.includes('JWT')) {
      throw new Error("Your session is invalid. Please sign in again.");
    }
    throw new Error(errorMsg);
  }

  const user = userData.user;

  // Require authenticated user with email
  if (!user || !user.email) {
    throw new Error("You must be signed in to generate share tokens");
  }

  // Check subscription status before allowing share token generation
  const subscription = await getUserSubscription(supabase, user.id);
  const planType = subscription?.plan_type || "base";
  const hasPaidSubscription = planType === "pro" || planType === "standard" || planType === "lifetime";

  if (!hasPaidSubscription) {
    redirect("/pricing");
  }

  const newToken = createShareToken();
  const { error: updateError } = await supabase
    .from("scoreboards")
    .update({ share_token: newToken })
    .eq("id", boardId)
    .eq("owner_id", user.id);

  if (updateError) {
    throw new Error(updateError.message || "Failed to regenerate share token");
  }

  revalidatePath(`/scoreboard/${boardId}`);
  revalidatePath(`/share/${newToken}`);
}

export default async function ScoreboardPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { board, hasPaidSubscription } = await loadScoreboard(id);

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
            <Link
              href="/dashboard"
              className="rounded-md border border-black/20 px-4 py-2 text-sm font-semibold text-black transition hover:border-black/40 hover:bg-white"
            >
              Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
        {/* Header Navigation */}
        <header className="flex items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:text-zinc-700 transition-colors whitespace-nowrap"
            >
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">Back to dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="h-4 w-px bg-black/20" />
            <UndoRedoControlsWrapper />
            <div className="h-4 w-px bg-black/20" />
            <ResetPositionsButton boardId={board.id} compact={true} />
          </div>

          {/* Share Controls - Full Width Link Bar */}
          <div className="flex-1 min-w-0">
            {shareUrl ? (
              <div className="relative w-full">
                <input
                  readOnly
                  value={shareUrl}
                  className="w-full truncate rounded-lg border border-black/15 bg-white px-3 py-1.5 pr-40 text-xs font-semibold text-black shadow-inner shadow-black/5"
                />
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  <CopyButton
                    value={shareUrl}
                    label="Copy"
                    className="cursor-pointer rounded border border-black/20 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition-all duration-150 hover:border-black/40 hover:bg-white active:scale-95 whitespace-nowrap"
                  />
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer inline-flex items-center justify-center rounded border border-black/20 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition-all duration-150 hover:border-black/40 hover:bg-white active:scale-95 whitespace-nowrap"
                    aria-label="Open link in new tab"
                    title="Go Live"
                  >
                    Go Live
                  </a>
                  {controlsShareUrl && (
                    <>
                      <div className="h-4 w-px bg-black/20 mx-0.5" />
                      <CopyButton
                        value={controlsShareUrl}
                        label="Share Scorekeeping"
                        maintainSize={true}
                        className="cursor-pointer rounded border border-black/20 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition-all duration-150 hover:border-black/40 hover:bg-white active:scale-95 whitespace-nowrap"
                      />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-black whitespace-nowrap">
                  Generate token
                </p>
                {hasPaidSubscription ? (
                  <form action={generateShareToken} className="flex-shrink-0">
                    <input type="hidden" name="boardId" value={board.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-lg border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
                    >
                      Generate
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-lg border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
                  >
                    Generate
                  </Link>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Scoreboard Preview */}
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
          />
        </div>

        {/* Controls Section */}
        <section className="space-y-6 sm:space-y-8">
          {/* Score Controls - Single Panel */}
          <div className="rounded-2xl border border-black/5 bg-white/80 p-4 sm:p-6 lg:p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)] relative">
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
              <SaveStatusIndicator />
            </div>
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

                {/* A Side Score - Left Counter */}
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

                {/* B Side Score - Right Counter */}
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
