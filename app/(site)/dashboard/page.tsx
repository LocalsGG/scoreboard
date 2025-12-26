import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatDate } from "@/lib/dates";
import { getGameIcon, getGameName, GAME_CONFIGS } from "@/lib/assets";
import { getDefaultLogo } from "@/components/scoreboard-preview/gameConfigs";
import type { ScoreboardType } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserSubscription, getBoardLimit } from "@/lib/users";
import { DeleteBoardButton } from "@/components/DeleteBoardButton";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { BoardLimitBanner } from "@/components/BoardLimitBanner";
import type { ScoreboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your scoreboards. Create, edit, and organize your live scoreboard overlays for streaming.",
  robots: {
    index: false,
    follow: false,
  },
};

const deleteBoard = async (boardId: string) => {
  "use server";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow anonymous users to delete their boards
  const userId = user?.id;
  if (!userId) {
    throw new Error("You must be signed in to delete boards");
  }

  if (!boardId) return;

  // Get the scoreboard's custom_logo_url and character icons before deleting
  const { data: scoreboard } = await supabase
    .from("scoreboards")
    .select("custom_logo_url, a_side_icon, b_side_icon")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .single();

  const CHARACTER_ICONS_BUCKET = "scoreboard-public";
  const LOGOS_BUCKET = "scoreboard-public";

  // Delete the logo file from storage if it exists
  if (scoreboard?.custom_logo_url) {
    const logoUrl = scoreboard.custom_logo_url;
    
    try {
      // Check if this is a custom logo from the new bucket structure
      if (logoUrl.includes(LOGOS_BUCKET)) {
        // Extract filename from URL
        const urlParts = logoUrl.split("/");
        const filename = urlParts[urlParts.length - 1];
        
        if (filename) {
          // Delete the file from storage
          await supabase.storage
            .from(LOGOS_BUCKET)
            .remove([filename]);
        }
      }
      // Also handle old bucket structure ("public images" with "custom-logos" path)
      else if (logoUrl.includes("custom-logos")) {
        const urlParts = logoUrl.split("/");
        const filename = urlParts[urlParts.length - 1];
        if (filename) {
          // Try to delete from old bucket structure
          await supabase.storage
            .from("public images")
            .remove([`custom-logos/${filename}`]);
        }
      }
    } catch (deleteError) {
      // Log error but don't fail the deletion - storage cleanup is best effort
      console.warn("Failed to delete logo file from storage:", deleteError);
    }
  }

  // Delete custom character icons from storage if they exist
  const iconUrls = [scoreboard?.a_side_icon, scoreboard?.b_side_icon].filter(Boolean) as string[];
  for (const iconUrl of iconUrls) {
    if (iconUrl && iconUrl.includes(CHARACTER_ICONS_BUCKET)) {
      try {
        const urlParts = iconUrl.split("/");
        const filename = urlParts[urlParts.length - 1];
        // Only delete if it's a custom upload (starts with boardId_)
        if (filename && filename.startsWith(`${boardId}_`)) {
          await supabase.storage
            .from(CHARACTER_ICONS_BUCKET)
            .remove([filename]);
        }
      } catch (deleteError) {
        // Log error but don't fail the deletion - storage cleanup is best effort
        console.warn("Failed to delete character icon file from storage:", deleteError);
      }
    }
  }

  // Delete the scoreboard from database
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

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  
  // Get the user - use getUser() instead of getSession() for security
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;
  const userEmail = user?.email;
  const isAnonymous = userId && !userEmail; // Guest user (has session but no email)
  
  // Redirect to auth only if no user at all, or if anonymous user (they should use scoreboard pages directly)
  if (!userId) {
    redirect("/auth");
  }
  
  // For anonymous users, redirect them to home or allow them to view (they can't manage boards from dashboard)
  if (isAnonymous) {
    redirect("/");
  }


  const result = await supabase
    .from("scoreboards")
    .select("id, name, updated_at, owner_id, scoreboard_type")
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
              </div>
            </header>
            {planType === "base" && <UpgradeBanner />}
            {!canCreateMore && <BoardLimitBanner boardLimit={boardLimit} />}
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
                      
                      // Get scoreboard type display name
                      const scoreboardType = board.scoreboard_type as ScoreboardType | null;
                      const typeDisplayName = scoreboardType && scoreboardType in GAME_CONFIGS
                        ? GAME_CONFIGS[scoreboardType].displayName
                        : gameName;

                      return (
                        <li
                          key={board.id}
                          className="flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-black/8 bg-white/80 p-3 sm:p-4 shadow-sm shadow-black/5 transition-transform duration-150 ease-out hover:-translate-y-0.5"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <Image
                              src={board.scoreboard_type ? getDefaultLogo(board.scoreboard_type as ScoreboardType) : getGameIcon(board.name)}
                              alt={`${label} icon`}
                              width={24}
                              height={24}
                              className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"
                              unoptimized
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 truncate">
                                {typeDisplayName}
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
