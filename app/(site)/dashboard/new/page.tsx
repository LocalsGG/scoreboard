import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { getSupabaseStorageUrl, GAME_CONFIGS } from "@/lib/assets";
import type { ScoreboardType } from "@/lib/types";
import { CreateBoardButton } from "@/components/CreateBoardButton";
import { CreateBoardFormWrapper } from "@/components/CreateBoardFormWrapper";

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

  const rawName = (formData.get("name") as string | null) ?? "";
  const name = rawName.trim() || "Generic Scoreboard";
  
  // Get scoreboard_type from form data and map template slug to database value
  const rawType = (formData.get("scoreboard_type") as string | null) ?? "";
  const scoreboardType = rawType ? getScoreboardTypeFromSlug(rawType) : null;
  
  // Get default logo URL based on game type
  const customLogoUrl = getDefaultLogoUrl(scoreboardType);

  const localId = `local-${randomUUID()}`;
  const params = new URLSearchParams();
  params.set("local", "true");
  params.set("name", name);
  if (scoreboardType) {
    params.set("scoreboard_type", scoreboardType);
  }
  if (customLogoUrl) {
    params.set("customLogoUrl", customLogoUrl);
  }

  redirect(`/scoreboard/${localId}?${params.toString()}`);
}

export default async function NewScoreboardPage() {
  // Allow unauthenticated users to access and create a previewable board.
  // Editing will require signing in on the scoreboard page.

  return (
    <div className="flex min-h-full justify-center px-6 py-16 font-sans">
      <main className="w-full max-w-5xl space-y-10 animate-fade-in">
        <div className="flex justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 opacity-70 hover:opacity-100 active:scale-95"
            aria-label="Back to home"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              &larr;
            </span>
            <span>Back to home</span>
          </Link>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-9 shadow-sm animate-rise">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-black">Choose a Game</h2>
            <p className="text-sm text-zinc-600">
              Choose the game you want to make a scoreboard for. If your game isn&apos;t listed, just pick the generic option.
            </p>
          </div>
          <CreateBoardFormWrapper>
            <div className="grid gap-4 sm:grid-cols-2">
              {getGameTemplates().map((template) => (
                <form key={template.slug} action={createBoard} className="h-full">
                  <input type="hidden" name="name" value={`${template.name} Scoreboard`} />
                  <input type="hidden" name="scoreboard_type" value={template.slug} />
                  <CreateBoardButton
                    templateIcon={template.icon}
                    templateName={template.name}
                  />
                </form>
              ))}
            </div>
          </CreateBoardFormWrapper>
        </section>
      </main>
    </div>
  );
}
