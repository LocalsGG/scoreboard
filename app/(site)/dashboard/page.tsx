import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatDate } from "@/lib/dates";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ScoreboardRow = {
  id: string;
  name: string | null;
  created_at: string | null;
  owner_id: string | null;
};

const deleteBoard = async (boardId: string) => {
  "use server";

  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  if (!boardId) return;

  const { error } = await supabase
    .from("scoreboards")
    .delete()
    .eq("id", boardId)
    .eq("owner_id", session.user.id);

  if (error) {
    console.error("Failed to delete board", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  const { data: boards, error } = await supabase
    .from("scoreboards")
    .select("id, name, created_at, owner_id")
    .eq("owner_id", session.user.id)
    .order("created_at", { ascending: false })
    .returns<ScoreboardRow[]>();

  return (
    <div className="flex min-h-full justify-center px-6 py-16 font-sans">
      <main className="w-full max-w-5xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Dashboard
            </p>
            <h1 className="text-4xl font-extrabold text-black dark:text-white">
              Your boards
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/new"
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              + New board
            </Link>
          </div>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white/70 p-9 dark:border-zinc-800 dark:bg-zinc-950/60">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-200">
              <p className="font-semibold">Couldn&apos;t load boards</p>
              <p className="mt-1">{error.message}</p>
            </div>
          ) : boards && boards.length > 0 ? (
            <ul className="divide-y divide-zinc-200/80 text-sm dark:divide-zinc-800">
              {boards.map((board) => {
                const label = board.name || "Untitled board";
                const createdLabel = formatDate(board.created_at);
                const shortId = board.id ? `${board.id.slice(0, 8)}…` : "Unknown";
                const viewHref = `/scoreboard/${board.id}`;

                return (
                  <li key={board.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                          Board
                        </p>
                        <h2 className="text-base font-semibold text-black dark:text-white">
                          <Link href={viewHref} className="transition hover:text-zinc-700 dark:hover:text-zinc-200">
                            {label}
                          </Link>
                        </h2>
                        {createdLabel ? (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Created {createdLabel}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-zinc-900/5 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                          {shortId}
                        </span>
                        <Link
                          href={viewHref}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-black transition hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800/60"
                        >
                          Open
                        </Link>
                        <form action={deleteBoard.bind(null, board.id)}>
                          <button
                            type="submit"
                            className="rounded-full px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                    {board.owner_id ? (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Owner: {board.owner_id}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300/80 bg-white/60 p-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
              <p className="text-base font-semibold">This list is empty.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
