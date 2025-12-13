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
      <header className="border-b border-zinc-200 px-6 py-4 text-sm font-semibold bg-white">
        <div className="mx-auto w-full max-w-6xl">
          <Navbar />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-zinc-200 bg-white px-6 py-6 text-sm text-zinc-600">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1 text-center">
          <span className="text-xs font-semibold tracking-[0.3em] text-black">
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
