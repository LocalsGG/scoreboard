import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Scoreboard.to | Live score overlays for gaming and esports",
  description:
    "Drop a single URL into OBS, Streamlabs, vMix, or Wirecast and keep every score updated in real time. Built for gamers, esports, and rec leagues.",
};

const splashImagePaddingTop =
  process.env.NEXT_PUBLIC_SPLASH_IMAGE_PADDING_TOP ?? "0px";
const heroScoreboardImages = [
  "/scoreboard1.svg",
  "/scoreboard2.svg",
  "/scoreboard3.svg",
];

export default async function Home() {
  let session = null;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const supabase = await createServerSupabaseClient();
    const sessionResponse = await supabase.auth.getSession();
    session = sessionResponse.data.session;
  }

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start gap-8 px-6 pb-12 pt-12 text-center font-sans">
      <div className="flex w-full max-w-3xl flex-col items-center gap-4">
        <h1 className="text-4xl font-black uppercase tracking-tight text-black dark:text-white sm:text-5xl">
          Keep every stream's score in sync anywhere
        </h1>
      </div>
      <div
        className="relative w-screen max-w-none -mx-6 sm:-mx-12"
        style={{ paddingTop: splashImagePaddingTop }}
      >
        <div className="relative overflow-hidden rounded-3xl bg-transparent">
          <div className="splash-marquee-wrapper">
            <div className="splash-marquee-track">
              {[...heroScoreboardImages, ...heroScoreboardImages].map(
                (src, index) => (
                  <div key={`${src}-${index}`} className="splash-marquee-item">
                    <Image
                      src={src}
                      alt="Scoreboard overlay"
                      width={1280}
                      height={720}
                      priority={index === 0}
                      className="h-auto w-full"
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full max-w-3xl flex-col items-center gap-4">
        <p className="max-w-3xl text-lg text-zinc-800 dark:text-zinc-200 sm:text-xl">
          Share a live scoreboard link so family and fans can follow the game in real time. Use it on a stream, a TV, or
          just phones on the sideline. No installs, runs from your browser.
        </p>
        <Link
          href="/auth"
          className="inline-flex w-full max-w-sm items-center justify-center rounded-xl bg-black px-7 py-3.5 text-base font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-zinc-900 dark:bg-white dark:text-black"
        >
          Create a Scoreboard for Free
        </Link>
      </div>
    </main>
  );
}
