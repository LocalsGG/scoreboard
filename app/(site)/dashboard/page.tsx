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

  const boardList = Array.isArray(boards) ? boards : [];
  const hasBoards = boardList.length > 0;
  const createTile = (
    <li
      key="create-tile"
      className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/20 bg-white/80 p-5 text-center shadow-sm shadow-black/5"
    >
      <Link
        href="/dashboard/new"
        aria-label="Create a new board"
        className="flex h-16 w-16 items-center justify-center rounded-full border border-black/20 bg-white text-3xl text-black transition-all duration-150 hover:-translate-y-0.5 hover:bg-zinc-100 active:scale-95"
      >
        <span aria-hidden="true">+</span>
      </Link>
      <p className="text-xs text-black">Create new scoreboard.</p>
    </li>
  );

  return (
    <div className="flex min-h-full justify-center px-6 py-16 font-sans">
      <main className="w-full max-w-6xl space-y-8 animate-fade-in">
        <section className="space-y-6 rounded-3xl border border-black/5 bg-white/80 p-9 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur animate-rise">
          <header>
            <h1 className="text-3xl font-semibold text-black">Your Scoreboards</h1>
          </header>
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Couldn&apos;t load boards</p>
              <p className="mt-1">{error.message}</p>
            </div>
          ) : (
            <ul className="grid gap-4 text-sm sm:grid-cols-1 md:grid-cols-2">
              {hasBoards
                ? boardList.map((board) => {
                    const label = board.name || "Untitled board";
                    const createdLabel = formatDate(board.created_at);
                    const viewHref = `/scoreboard/${board.id}`;

                    return (
                      <li
                        key={board.id}
                        className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-black/8 bg-white/80 p-5 shadow-sm shadow-black/5 transition-transform duration-150 ease-out hover:-translate-y-0.5"
                      >
                        <div className="space-y-1">
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
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={viewHref}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${label} in a new tab`}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-white text-xl text-black shadow-sm shadow-black/5 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/30 hover:bg-white active:scale-95"
                          >
                            ↗
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
                      </li>
                    );
                  })
                : null}
              {createTile}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
