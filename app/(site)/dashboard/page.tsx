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
      <main className="w-full max-w-5xl space-y-8 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black">
              Dashboard
            </p>
            <h1 className="text-4xl font-extrabold text-black">
              Your boards
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/new"
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)] active:scale-95"
            >
              + New board
            </Link>
          </div>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-9 shadow-sm animate-rise">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Couldn&apos;t load boards</p>
              <p className="mt-1">{error.message}</p>
            </div>
          ) : boards && boards.length > 0 ? (
            <ul className="divide-y divide-zinc-200 text-sm">
              {boards.map((board) => {
                const label = board.name || "Untitled board";
                const createdLabel = formatDate(board.created_at);
                const shortId = board.id ? `${board.id.slice(0, 8)}…` : "Unknown";
                const viewHref = `/scoreboard/${board.id}`;

                return (
                  <li
                    key={board.id}
                    className="flex flex-col gap-2 py-4 transition-transform duration-150 ease-out first:pt-0 last:pb-0 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Board
                        </p>
                        <h2 className="text-base font-semibold text-black">
                          <Link
                            href={viewHref}
                            className="transition-colors duration-150 hover:text-zinc-700"
                          >
                            {label}
                          </Link>
                        </h2>
                        {createdLabel ? (
                          <p className="text-xs text-black">
                            Created {createdLabel}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black">
                          {shortId}
                        </span>
                        <Link
                          href={viewHref}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:bg-zinc-100 active:scale-95"
                        >
                          Open
                        </Link>
                        <form action={deleteBoard.bind(null, board.id)}>
                          <button
                            type="submit"
                            className="rounded-full px-3 py-1 text-xs font-semibold text-red-600 transition-all duration-150 hover:-translate-y-0.5 hover:bg-red-50 active:scale-95"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                    {board.owner_id ? (
                      <p className="text-xs text-black">
                        Owner: {board.owner_id}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-black/20 bg-white p-7 text-black">
              <p className="text-base font-semibold text-black">This list is empty.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
