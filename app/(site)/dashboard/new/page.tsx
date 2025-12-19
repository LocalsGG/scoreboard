import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureUserExists, getUserSubscription, getBoardLimit } from "@/lib/users";
import { getSupabaseStorageUrl, GAME_CONFIGS } from "@/lib/assets";
import type { ScoreboardType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create New Scoreboard",
  description: "Create a new live scoreboard overlay for streaming. Choose from Melee, Ultimate, Guilty Gear Strive, or Generic templates.",
  robots: {
    index: false,
    follow: false,
  },
};

type Template = {
  slug: string;
  name: string;
  icon: string;
};

// Map template slugs to database scoreboard_type values
function getScoreboardTypeFromSlug(slug: string): string {
  if (slug === "guilty-gear-strive") {
    return "guilty-gear";
  }
  return slug;
}

// Get default logo URL based on scoreboard type
function getDefaultLogoUrl(scoreboardType: string | null): string | null {
  if (!scoreboardType || !(scoreboardType in GAME_CONFIGS)) {
    return null;
  }
  const baseUrl = getSupabaseStorageUrl();
  const config = GAME_CONFIGS[scoreboardType as ScoreboardType];
  return `${baseUrl}/${config.icon}`;
}

const getGameTemplates = (): Template[] => {
  const baseUrl = getSupabaseStorageUrl();
  return [
    {
      slug: "melee",
      name: "Super Smash Bros. Melee",
      icon: `${baseUrl}/melee-icon.svg`,
    },
    {
      slug: "ultimate",
      name: "Super Smash Bros. Ultimate",
      icon: `${baseUrl}/ultimate-icon.svg`,
    },
    {
      slug: "guilty-gear-strive",
      name: "Guilty Gear Strive",
      icon: `${baseUrl}/guilty-icon.svg`,
    },
    {
      slug: "generic",
      name: "Generic",
      icon: `${baseUrl}/logo.svg`,
    },
  ];
};

async function createBoard(formData: FormData) {
  "use server";

  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  if (!userId || !userEmail) {
    throw new Error("You must be signed in to create boards");
  }

  // Ensure user exists in public.profiles table before creating scoreboard
  // This handles cases where the user exists in auth.users but not in public.profiles
  const userCheck = await ensureUserExists(supabase, userId, userEmail);
  if (!userCheck.success) {
    throw new Error(`Failed to ensure user exists: ${userCheck.error}`);
  }

  // Check board limit before creating
  const subscription = await getUserSubscription(supabase, userId);
  const planType = subscription?.plan_type || "base";
  const boardLimit = getBoardLimit(planType);
  
  // Count existing boards
  const { count, error: countError } = await supabase
    .from("scoreboards")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId);
  
  if (countError) {
    throw new Error(`Failed to check board count: ${countError.message}`);
  }
  
  const currentBoardCount = count || 0;
  if (currentBoardCount >= boardLimit) {
    redirect("/pricing?limit_reached=true");
  }

  const rawName = (formData.get("name") as string | null) ?? "";
  const name = rawName.trim() || "Generic Scoreboard";
  const shareToken = randomUUID().replace(/-/g, "");
  
  // Get scoreboard_type from form data and map template slug to database value
  const rawType = (formData.get("scoreboard_type") as string | null) ?? "";
  const scoreboardType = rawType ? getScoreboardTypeFromSlug(rawType) : null;
  
  // Get default logo URL based on game type
  const customLogoUrl = getDefaultLogoUrl(scoreboardType);

  const { data, error } = await supabase
    .from("scoreboards")
    .insert({
      name,
      owner_id: userId,
      share_token: shareToken,
      scoreboard_type: scoreboardType || null,
      custom_logo_url: customLogoUrl,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Board created without an id");
  }

  revalidatePath("/dashboard");
  redirect(`/scoreboard/${data.id}`);
}

export default async function NewScoreboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  if (!userId || !userEmail) {
    redirect("/auth");
  }

  return (
    <div className="flex min-h-full justify-center px-6 py-16 font-sans">
      <main className="w-full max-w-5xl space-y-10 animate-fade-in">
        <div className="flex justify-start">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 opacity-70 hover:opacity-100 active:scale-95"
            aria-label="Back to dashboard"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              &larr;
            </span>
            <span>Back to dashboard</span>
          </Link>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-9 shadow-sm animate-rise">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-black">Choose a Game</h2>
            <p className="text-sm text-zinc-600">
              Choose the game you want to make a scoreboard for. If your game isn&apos;t listed, just pick the generic option.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {getGameTemplates().map((template) => (
              <form key={template.slug} action={createBoard} className="h-full">
                <input type="hidden" name="name" value={`${template.name} Scoreboard`} />
                <input type="hidden" name="scoreboard_type" value={template.slug} />
                <button
                  type="submit"
                  className="group flex h-full w-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={template.icon}
                      alt={`${template.name} icon`}
                      width={32}
                      height={32}
                      className="h-8 w-8"
                      unoptimized
                    />
                    <h3 className="text-lg font-semibold text-black">
                      {template.name}
                    </h3>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-black transition group-hover:translate-x-0.5">
                    Start with this
                    <span aria-hidden>→</span>
                  </span>
                </button>
              </form>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
