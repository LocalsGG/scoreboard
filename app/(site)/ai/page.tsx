import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI-Powered Livestream Score Management | Coming Soon",
  description:
    "We're working on an AI-powered feature that will automatically manage your livestream scores. Let AI handle score tracking so you can focus on your stream.",
};

export default function AIPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-12 sm:pt-16">
        <section className="flex flex-col items-center gap-6 text-center">
          <div className="space-y-4 w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wide text-zinc-700 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              Coming Soon
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase leading-tight tracking-tight text-black">
              AI-Powered Score Management
            </h1>
            <p className="text-base sm:text-lg font-semibold text-zinc-700">
              Let AI manage your livestream scores automatically
            </p>
            <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto">
              We're building an intelligent feature that uses AI to automatically track and update scores in your livestream. No more manual score updates—just focus on your stream while AI handles the rest.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href="https://discord.gg/vS6gQZyNgT"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-black via-black to-zinc-800 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_15px_45px_rgba(12,18,36,0.18)] transition duration-150 hover:-translate-y-0.5 active:scale-95"
              >
                Join Discord Community
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
