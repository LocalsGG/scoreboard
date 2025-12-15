import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatDate } from "@/lib/dates";
import { getGameIcon, getGameName } from "@/lib/assets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserData, getUserSubscription, getBoardLimit } from "@/lib/users";
import { syncSubscriptionFromCheckoutSessionId } from "@/lib/billing";
import { DeleteBoardButton } from "@/components/DeleteBoardButton";
import type { ScoreboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const deleteBoard = async (boardId: string) => {
  "use server";

  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow anonymous users to delete their boards
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("You must be signed in to delete boards");
  }

  if (!boardId) return;

  const { error } = await supabase
    .from("scoreboards")
    .delete()
    .eq("id", boardId)
    .eq("owner_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  
  // Get the session - code exchange is handled by the callback route
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  if (!userId || !userEmail) {
    redirect("/auth");
  }

  const params = await searchParams;
  const checkoutStatus = params?.checkout;
  const checkoutSessionId = params?.session_id;
  if (checkoutStatus === "success" && checkoutSessionId) {
    await syncSubscriptionFromCheckoutSessionId({ userId, checkoutSessionId });
  }

  const result = await supabase
    .from("scoreboards")
    .select("id, name, updated_at, owner_id")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  const { data: boards, error } = result as { data: ScoreboardRow[] | null; error: { message?: string } | null };
  const boardList: ScoreboardRow[] = (boards && Array.isArray(boards)) ? boards : [];
  const hasBoards = boardList.length > 0;
  
  // Get user subscription status and board limit
  const subscription = await getUserSubscription(supabase, userId);
  const planType = subscription?.plan_type || "base";
  const boardLimit = getBoardLimit(planType);
  const currentBoardCount = boardList.length;
  const canCreateMore = currentBoardCount < boardLimit;
  
  const createTile = (
    <li
      key="create-tile"
      className="flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-dashed border-black/20 bg-white/80 p-3 sm:p-4 shadow-sm shadow-black/5 transition-transform duration-150 ease-out hover:-translate-y-0.5"
    >
      <Link
        href="/dashboard/new"
        aria-label="Create a new board"
        className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1"
      >
        <div className="flex h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-black/30 bg-white text-base sm:text-lg text-black">
          <span aria-hidden="true">+</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            New
          </p>
          <p className="text-sm sm:text-base font-semibold text-black">
            Create new scoreboard
          </p>
        </div>
      </Link>
    </li>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 flex justify-center px-4 py-8 sm:px-6 sm:py-12 md:py-16 font-sans">
        <div className="w-full max-w-6xl space-y-6 sm:space-y-8 animate-fade-in">
          <section className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-black/5 bg-white/80 p-6 sm:p-8 md:p-9 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur animate-rise">
            <header className="flex items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-semibold text-black">Your Scoreboards</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-600">
                  {currentBoardCount}/{boardLimit}
                </span>
                {!canCreateMore && (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:scale-95"
                  >
                    <span>Upgrade</span>
                    <span>→</span>
                  </Link>
                )}
              </div>
            </header>
            {!canCreateMore && (
              <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 text-sm">
                <p className="font-semibold text-orange-900">
                  You&apos;ve reached your board limit ({boardLimit} board{boardLimit !== 1 ? 's' : ''})
                </p>
                <p className="mt-1 text-orange-700">
                  <Link href="/pricing" className="font-semibold underline hover:text-orange-900">
                    Upgrade your plan
                  </Link>{" "}
                  to create more scoreboards.
                </p>
              </div>
            )}
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">Couldn&apos;t load boards</p>
                <p className="mt-1">{error.message || 'Unknown error'}</p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:gap-4 text-sm sm:grid-cols-1 md:grid-cols-2">
                {hasBoards
                  ? boardList.map((board) => {
                      const label = board.name || "Untitled board";
                      const gameName = getGameName(board.name);
                      const updatedLabel = formatDate(board.updated_at);
                      const viewHref = `/scoreboard/${board.id}`;

                      return (
                        <li
                          key={board.id}
                          className="flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-black/8 bg-white/80 p-3 sm:p-4 shadow-sm shadow-black/5 transition-transform duration-150 ease-out hover:-translate-y-0.5"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <Image
                              src={getGameIcon(board.name)}
                              alt={`${label} icon`}
                              width={24}
                              height={24}
                              className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"
                              unoptimized
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 truncate">
                                {gameName}
                              </p>
                              <h2 className="text-sm sm:text-base font-semibold text-black truncate">
                                <Link
                                  href={viewHref}
                                  className="transition-colors duration-150 hover:text-zinc-700"
                                >
                                  {label}
                                </Link>
                              </h2>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            {updatedLabel ? (
                              <p className="text-xs text-zinc-500 whitespace-nowrap hidden sm:block">
                                {updatedLabel}
                              </p>
                            ) : null}
                            <Link
                              href={viewHref}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open ${label} in a new tab`}
                              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-black/15 bg-white text-lg sm:text-xl text-black shadow-sm shadow-black/5 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/30 hover:bg-white active:scale-95 flex-shrink-0"
                            >
                              ↗
                            </Link>
                            <DeleteBoardButton
                              boardId={board.id}
                              boardName={board.name}
                              deleteAction={deleteBoard}
                            />
                          </div>
                        </li>
                      );
                    })
                  : null}
                {canCreateMore ? createTile : null}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
