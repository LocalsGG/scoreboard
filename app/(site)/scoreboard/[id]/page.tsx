import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { BoardNameEditor } from "@/components/BoardNameEditor";
import { RealtimeScoreboardName } from "@/components/RealtimeScoreboardName";
import { ScoreAdjuster } from "@/components/ScoreAdjuster";
import { SideNameEditor } from "@/components/SideNameEditor";
import { ScoreboardPreview } from "@/components/ScoreboardPreview";
import { formatDateTime } from "@/lib/dates";
import { ensureShareToken, regenerateShareToken } from "@/lib/scoreboards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  if (!user) {
    redirect("/auth");
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const ownerName =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    user.email ||
    "you";

  const { data: board, error: boardError } = await supabase
    .from("scoreboards")
    .select("id, name, created_at, share_token, owner_id, a_side, b_side, a_score, b_score, updated_at")
    .eq(isUuid ? "id" : "share_token", boardId)
    .eq("owner_id", user.id)
    .maybeSingle<Scoreboard>();

  if (boardError) {
    console.error("Failed to load scoreboard", boardError.message);
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

  if (!user) {
    redirect("/auth");
  }

  const newToken = await regenerateShareToken({ supabase, boardId, ownerId: user.id });

  revalidatePath(`/scoreboard/${boardId}`);
  revalidatePath(`/share/${newToken}`);
}

export default async function ScoreboardPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { board, ownerName } = await loadScoreboard(id);

  if (!board) {
    return (
      <div className="flex min-h-full justify-center px-6 py-16 font-sans">
        <main className="w-full max-w-3xl space-y-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Scoreboard
          </p>
          <h1 className="text-3xl font-extrabold text-black dark:text-white">
            Board not found or you don&apos;t have access.
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Double-check the link or open it from your dashboard.
          </p>
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-black transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-900/70"
            >
              Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const createdLabel = formatDateTime(board.created_at);
  const updatedLabel = formatDateTime(board.updated_at);
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
    <div className="flex min-h-full justify-center px-6 py-16 font-sans">
      <main className="w-full max-w-5xl space-y-10 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Scoreboard
            </p>
            <h1 className="text-4xl font-extrabold text-black dark:text-white">
              <RealtimeScoreboardName boardId={board.id} initialName={board.name} />
            </h1>
            {createdLabel ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Created {createdLabel}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-900/5 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-100">
              {board.id}
            </span>
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white active:scale-95 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-900/70"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white/70 p-8 shadow-sm animate-rise dark:border-zinc-800 dark:bg-zinc-950/60">
          <ScoreboardPreview
            boardId={board.id}
            initialName={board.name}
            initialASide={board.a_side}
            initialBSide={board.b_side}
            initialAScore={board.a_score}
            initialBScore={board.b_score}
            initialUpdatedAt={board.updated_at}
          />
        </section>

        <section className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white/70 p-8 shadow-sm animate-rise dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Controls
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                The owner of this board is {ownerName}.
              </p>
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {updatedLabel ? `Updated ${updatedLabel}` : "Waiting for first update."}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 rounded-xl border border-zinc-200/80 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
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

            <div className="space-y-4 rounded-xl border border-zinc-200/80 bg-white/80 p-5 text-center dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Scoreboard name
              </p>
              <BoardNameEditor boardId={board.id} initialName={board.name} align="center" />
            </div>

            <div className="space-y-4 rounded-xl border border-zinc-200/80 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
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

        <section className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white/70 p-8 shadow-sm animate-rise dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Share link (read-only)
              </p>
              <div className="mt-2 space-y-2 text-sm font-semibold text-black dark:text-white">
                {shareUrl ? (
                  <div className="space-y-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                    <div className="flex items-center gap-2">
                      <div className="relative w-full">
                        <input
                          readOnly
                          value={shareUrl}
                          className="w-full truncate rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 pr-24 text-sm font-semibold text-black dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-white"
                        />
                        <CopyButton
                          value={shareUrl}
                          label="Copy"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-zinc-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white active:scale-95 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-800/70"
                        />
                      </div>
                      <form action={generateShareToken}>
                        <input type="hidden" name="boardId" value={board.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white active:scale-95 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-900/70"
                        >
                          {board.share_token ? "Regenerate" : "Generate"}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Generate a token to create a shareable URL.
                    </p>
                    <form action={generateShareToken}>
                      <input type="hidden" name="boardId" value={board.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white active:scale-95 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-900/70"
                      >
                        Generate
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Record
              </p>
              <div className="mt-2 space-y-1 text-sm text-black dark:text-white">
                <div className="flex justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    owner_id
                  </span>
                  <span className="truncate">{board.owner_id ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    id
                  </span>
                  <span className="truncate">{board.id}</span>
                </div>
                <div className="flex justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    created_at
                  </span>
                  <span className="truncate">{board.created_at ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    share_token
                  </span>
                  <span className="truncate">{board.share_token ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
