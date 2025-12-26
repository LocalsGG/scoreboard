import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { OAuthCallbackHandler } from "@/components/OAuthCallbackHandler";
import { AnimatedLayout } from "./animated-layout";

export const metadata: Metadata = {
  title: {
    default: "Scoreboardtools - Live Scoreboard Overlays for Streaming",
    template: "%s | Scoreboardtools",
  },
  description: "Create live scoreboard overlays for esports streaming. Works with OBS, Streamlabs, vMix, Wirecast, and more. Real-time score updates, no installs required.",
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <OAuthCallbackHandler />
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 px-6 py-4 text-sm font-semibold backdrop-blur">
        <div className="mx-auto w-full max-w-6xl">
          <Navbar />
        </div>
      </header>
      <AnimatedLayout>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-black/5 bg-white/80 px-6 py-8 text-sm text-zinc-700 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 text-center">
            <span className="text-black">© 2025 LOCALS.GG</span>
            <p className="text-sm text-zinc-600">
              Modern tools for real-world gaming events and communities.
            </p>
            <p className="text-sm text-zinc-600">
              <Link
                href="https://discord.gg/vS6gQZyNgT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:underline"
              >
                Let us know what features we should add!
              </Link>
            </p>
          </div>
        </footer>
      </AnimatedLayout>
    </div>
  );
}
