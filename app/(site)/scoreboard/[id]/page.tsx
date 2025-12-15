import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { BoardNameEditor } from "@/components/BoardNameEditor";
import { ScoreAdjuster } from "@/components/ScoreAdjuster";
import { SideNameEditor } from "@/components/SideNameEditor";
import { ScoreboardPreview } from "@/components/ScoreboardPreview";
import { ScoreboardStyleSelector } from "@/components/ScoreboardStyleSelector";
import { ensureShareToken, regenerateShareToken } from "@/lib/scoreboards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ElementPositions } from "@/lib/types";

export const dynamic = "force-dynamic";

type Scoreboard = {
  id: string;
  name: string | null;
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
};

type LoadScoreboardResult = {
  board: Scoreboard | null;
  ownerName: string;
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
  if (userError) {
    throw new Error(userError.message);
  }
  const user = userData.user;

  // Allow anonymous users to access scoreboards
  if (!user) {
    throw new Error("You must be signed in to access scoreboards");
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const ownerName =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    user.email ||
    "you";

  // Select all columns, but handle element_positions gracefully if it doesn't exist
  let board: Scoreboard | null = null;
  let boardError: Error | null = null;
  
  try {
    const result = await supabase
      .from("scoreboards")
      .select("id, name, created_at, share_token, owner_id, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, element_positions")
      .eq(isUuid ? "id" : "share_token", boardId)
      .eq("owner_id", user.id)
      .maybeSingle<Scoreboard>();
    
    if (result.error) {
      // If error is about missing column, try without it
      if (result.error.message?.includes("element_positions") || result.error.message?.includes("column")) {
        const resultWithoutPos = await supabase
          .from("scoreboards")
          .select("id, name, created_at, share_token, owner_id, a_side, b_side, a_score, b_score, updated_at, scoreboard_style")
          .eq(isUuid ? "id" : "share_token", boardId)
          .eq("owner_id", user.id)
          .maybeSingle<Omit<Scoreboard, "element_positions"> & { element_positions?: null }>();
        
        if (resultWithoutPos.error) {
          boardError = new Error(resultWithoutPos.error.message);
        } else {
          board = { ...resultWithoutPos.data, element_positions: null } as Scoreboard;
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
    throw new Error(boardError.message);
  }

  if (!board) {
    return { board: null, ownerName };
  }

  // Ensure a share token exists for this board while keeping the logic in one place.
  const shareToken = await ensureShareToken({
    supabase,
    boardId: board.id,
    ownerId: user.id,
    existingToken: board.share_token,
  });

  board.share_token = shareToken;

  return { board, ownerName };
}

async function generateShareToken(formData: FormData) {
  "use server";

  const boardId = (formData.get("boardId") as string | null) ?? "";

  if (!boardId) {
    throw new Error("Missing board id");
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  const user = userData.user;

  // Allow anonymous users to generate share tokens
  if (!user) {
    throw new Error("You must be signed in to generate share tokens");
  }

  const newToken = await regenerateShareToken({ supabase, boardId, ownerId: user.id });

  revalidatePath(`/scoreboard/${boardId}`);
  revalidatePath(`/share/${newToken}`);
}

export default async function ScoreboardPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { board } = await loadScoreboard(id);

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

  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const headerBase = await (async () => {
    try {
      const hdrs = await Promise.resolve(headers());
      return typeof hdrs.get === "function" ? hdrs.get("origin") ?? "" : "";
    } catch {
      return "";
    }
  })();
  const baseUrl = envBase || headerBase;
  const sharePath = board.share_token ? `/share/${board.share_token}` : null;
  const shareUrl = sharePath
    ? baseUrl
      ? `${baseUrl}${sharePath}`
      : sharePath
    : null;

  return (
    <div className="relative flex min-h-full justify-center px-4 sm:px-6 py-6 sm:py-8 lg:py-12 font-sans">
      <main className="relative w-full max-w-6xl space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center sm:justify-start gap-2 rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-sm shadow-black/5 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/30 hover:bg-white active:scale-95 whitespace-nowrap"
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">Back to dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          {shareUrl ? (
            <div className="relative flex-1 min-w-0">
              <input
                readOnly
                value={shareUrl}
                className="w-full truncate rounded-xl border border-black/15 bg-white px-3 py-2 pr-24 sm:pr-32 md:pr-80 text-xs sm:text-sm font-semibold text-black shadow-inner shadow-black/5"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <CopyButton
                  value={shareUrl}
                  label="Copy"
                  className="cursor-pointer rounded-md border border-black/20 bg-white px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
                />
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer inline-flex items-center gap-1 justify-center rounded-md border border-black/20 bg-white px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
                  aria-label="Open link in new tab"
                >
                  <span className="hidden sm:inline">Open</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-3 w-3 sm:h-4 sm:w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2">
              <p className="text-xs font-medium text-black text-center sm:text-left">
                Generate a token to create a shareable URL.
              </p>
              <form action={generateShareToken} className="flex justify-center sm:justify-start">
                <input type="hidden" name="boardId" value={board.id} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
                >
                  Generate
                </button>
              </form>
            </div>
          )}
        </div>

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
          <div className="mt-4 sm:mt-6 rounded-2xl border border-black/8 bg-white/80 p-4 sm:p-5 shadow-sm shadow-black/5">
            <ScoreboardStyleSelector boardId={board.id} initialStyle={board.scoreboard_style} />
          </div>
        </section>
      </main>
    </div>
  );
}
