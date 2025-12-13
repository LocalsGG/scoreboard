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
              className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold text-black transition hover:border-black/40 hover:bg-white"
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
    <div className="relative flex min-h-full justify-center px-6 py-16 font-sans">
      <div className="pointer-events-none absolute inset-x-0 top-8 -z-10 h-72 bg-gradient-to-b from-sky-100/60 via-white to-transparent blur-3xl" />
      <main className="relative w-full max-w-6xl space-y-10 animate-fade-in">
        <section className="space-y-4 rounded-3xl border border-black/5 bg-white/80 px-6 py-6 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.18)] animate-pulse" />
                Scoreboard
              </span>
              <h1 className="text-4xl font-extrabold text-black">
                <RealtimeScoreboardName boardId={board.id} initialName={board.name} />
              </h1>
              {createdLabel ? (
                <p className="text-sm text-black">
                  Created {createdLabel}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black">
                {board.id}
              </span>
              <Link
                href="/dashboard"
                className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-sm shadow-black/5 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/30 hover:bg-white active:scale-95"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-black">
            <span className="rounded-full bg-black/5 px-3 py-1 font-semibold text-black">
              Owner: {ownerName}
            </span>
            <span className="rounded-full bg-black/5 px-3 py-1 font-semibold text-black">
              {updatedLabel ? `Updated ${updatedLabel}` : "Waiting for first update."}
            </span>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur animate-rise">
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

        <section className="space-y-6 rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur animate-rise">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-black">
                Controls
              </p>
              <p className="text-sm text-black">
                Tweak names and scores — updates push to every overlay instantly.
              </p>
            </div>
            <div className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black shadow-sm shadow-black/5">
              Live editing
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-4 rounded-2xl border border-black/8 bg-white/80 p-5 shadow-sm shadow-black/5">
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

            <div className="space-y-4 rounded-2xl border border-black/8 bg-white/80 p-5 text-center shadow-sm shadow-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                Scoreboard name
              </p>
              <BoardNameEditor boardId={board.id} initialName={board.name} align="center" />
            </div>

            <div className="space-y-4 rounded-2xl border border-black/8 bg-white/80 p-5 shadow-sm shadow-black/5">
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

        <section className="space-y-6 rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur animate-rise">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-black/8 bg-white/80 p-5 shadow-sm shadow-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                Share link (read-only)
              </p>
              <div className="mt-2 space-y-2 text-sm font-semibold text-black">
                {shareUrl ? (
                  <div className="space-y-2 text-xs font-medium text-black">
                    <div className="flex items-center gap-2">
                      <div className="relative w-full">
                        <input
                          readOnly
                          value={shareUrl}
                          className="w-full truncate rounded-xl border border-black/15 bg-white px-3 py-2 pr-24 text-sm font-semibold text-black shadow-inner shadow-black/5"
                        />
                        <CopyButton
                          value={shareUrl}
                          label="Copy"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-black/20 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
                        />
                      </div>
                      <form action={generateShareToken}>
                        <input type="hidden" name="boardId" value={board.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-lg border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
                        >
                          {board.share_token ? "Regenerate" : "Generate"}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-black">
                      Generate a token to create a shareable URL.
                    </p>
                    <form action={generateShareToken}>
                      <input type="hidden" name="boardId" value={board.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-lg border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
                      >
                        Generate
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-black/8 bg-white/80 p-5 shadow-sm shadow-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                Record
              </p>
              <div className="mt-2 space-y-1 text-sm text-black">
                <div className="flex justify-between gap-3 text-xs text-black">
                  <span className="font-semibold text-black">
                    owner_id
                  </span>
                  <span className="font-mono text-black">{board.owner_id ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3 text-xs text-black">
                  <span className="font-semibold text-black">
                    id
                  </span>
                  <span className="font-mono text-black">{board.id}</span>
                </div>
                <div className="flex justify-between gap-3 text-xs text-black">
                  <span className="font-semibold text-black">
                    created_at
                  </span>
                  <span className="font-mono text-black">{board.created_at ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3 text-xs text-black">
                  <span className="font-semibold text-black">
                    share_token
                  </span>
                  <span className="font-mono text-black">{board.share_token ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
