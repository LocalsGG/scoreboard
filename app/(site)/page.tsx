import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Scoreboard.to | Live score overlays for gaming and esports",
  description:
    "Drop a single URL into OBS, Streamlabs, vMix, or Wirecast and keep every score updated in real time. Built for gamers, esports, and rec leagues.",
};

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
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-12 px-6 py-16 font-sans">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Scoreboard.to
          </p>
          <h1 className="text-4xl font-black text-black dark:text-white sm:text-5xl">
            Live score overlays for gamers, esports, and pickup leagues.
          </h1>
          <p className="text-lg text-zinc-700 dark:text-zinc-300">
            Drop one URL into OBS, Streamlabs, vMix, Wirecast, or XSplit and run
            a clean, broadcast-quality scoreboard with zero plugins or setup
            headaches. Built for modern streams that need fast, reliable updates.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Launch scoreboard
            </Link>
          </div>
          <ul className="grid gap-3 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            <li className="rounded-xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="font-semibold text-black dark:text-white">
                Setup in under 60 seconds
              </p>
              <p>Copy the browser source URL and go live—no downloads, no bloat.</p>
            </li>
            <li className="rounded-xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="font-semibold text-black dark:text-white">
                Broadcast-ready graphics
              </p>
              <p>Transparent overlays, smooth motion, and HD clarity on any budget.</p>
            </li>
            <li className="rounded-xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="font-semibold text-black dark:text-white">
                Works with every rig
              </p>
              <p>Compatible with OBS, Streamlabs, vMix, Wirecast, and XSplit.</p>
            </li>
            <li className="rounded-xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="font-semibold text-black dark:text-white">
                Flexible for every game
              </p>
              <p>Perfect for gaming streams, esports productions, and weekend sports.</p>
            </li>
          </ul>
        </div>
        <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-950/60">
          <p className="text-base font-semibold text-black dark:text-white">
            Go live with one link
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Drop your overlay URL into your streaming software and keep every score
            synced in real time—no plugins, no extra downloads.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Compatible with OBS Studio, Streamlabs, vMix, Wirecast, XSplit, and any
            browser-source setup.
          </p>
        </div>
      </section>
    </main>
  );
}
