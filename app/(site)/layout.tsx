import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Scoreboard",
  description: "Simple Supabase-powered scoreboards and dashboards.",
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 px-6 py-4 text-sm font-semibold backdrop-blur">
        <div className="mx-auto w-full max-w-6xl">
          <Navbar />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-black/5 bg-white/80 px-6 py-8 text-sm text-zinc-700 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 text-center">
          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-black">
            LOCALS.GG
          </span>
          <span className="text-black">© 2025 LOCALS.GG</span>
          <p className="text-sm text-zinc-600">
            Modern tools for real-world gaming events and communities.
          </p>
        </div>
      </footer>
    </div>
  );
}
