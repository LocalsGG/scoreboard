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
      <header className="border-b border-zinc-200/70 bg-white/65 px-6 py-4 text-sm font-semibold dark:border-zinc-800/70 dark:bg-zinc-950/60">
        <div className="mx-auto w-full max-w-6xl">
          <Navbar />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-zinc-200/70 bg-white/65 px-6 py-6 text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-zinc-400">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <span className="font-semibold text-black dark:text-white">
            Scoreboard
          </span>
          <span>Supabase + Next.js</span>
        </div>
      </footer>
    </div>
  );
}
