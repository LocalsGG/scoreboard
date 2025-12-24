import { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  
  return {
    title: "AI-Powered Livestream Score Management | Coming Soon",
    description:
      "We're working on an AI-powered feature that will automatically manage your livestream scores. Let AI handle score tracking so you can focus on your stream.",
    keywords: [
      "AI scoreboard",
      "AI livestream",
      "automatic score tracking",
      "AI streaming tools",
      "smart scoreboard",
      "AI esports",
      "automated score management",
    ],
    alternates: {
      canonical: siteUrl ? `${siteUrl}/ai` : undefined,
    },
    openGraph: {
      title: "AI-Powered Livestream Score Management | Scoreboardtools",
      description:
        "We're working on an AI-powered feature that will automatically manage your livestream scores. Coming soon.",
      type: "website",
      siteName: "Scoreboardtools",
      url: siteUrl ? `${siteUrl}/ai` : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "AI-Powered Livestream Score Management | Scoreboardtools",
      description:
        "We're working on an AI-powered feature that will automatically manage your livestream scores. Coming soon.",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function AIPage() {
  const siteUrl = await getSiteUrl();
  
  const features = [
    {
      title: "Automatic Score Detection",
      description:
        "AI watches your stream and automatically detects score changes, eliminating the need for manual updates.",
    },
    {
      title: "Real-Time Updates",
      description:
        "Scores update instantly as the AI recognizes changes in your livestream, keeping your overlay always accurate.",
    },
    {
      title: "Multi-Game Support",
      description:
        "Works across different esports titles and game types, learning patterns to provide accurate score tracking.",
    },
    {
      title: "Focus on Your Stream",
      description:
        "Let AI handle the scoreboard while you focus on commentary, gameplay, and engaging with your audience.",
    },
  ];

  return (
    <main className="relative isolate overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 sm:gap-10 lg:gap-16 px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-8 sm:pt-12">
        {/* Hero Section */}
        <section className="flex flex-col items-center gap-6 sm:gap-8 text-center">
          <div className="space-y-3 sm:space-y-4 w-full max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wide text-zinc-700 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              Coming Soon
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black uppercase leading-tight tracking-tight text-black">
              AI-Powered Score Management
            </h1>
            <p className="w-full text-base sm:text-lg lg:text-xl font-semibold text-zinc-700 px-2">
              Let AI manage your livestream scores automatically
            </p>
            <p className="text-sm sm:text-base lg:text-lg text-zinc-600 px-2 max-w-3xl mx-auto">
              We're building an intelligent feature that uses AI to automatically track and update scores in your livestream. No more manual score updates—just focus on your stream while AI handles the rest.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full rounded-2xl sm:rounded-3xl border border-black/5 bg-white/80 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 shadow-xl shadow-black/10 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8 lg:gap-10">
            <div className="space-y-2 sm:space-y-3 text-center">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-zinc-600">
                How it works
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black">
                Intelligent Score Tracking
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-zinc-700 px-2">
                Our AI watches your stream and automatically detects score changes, updating your overlay in real time.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 text-left grid-cols-1 sm:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-black/8 bg-gradient-to-b from-white/90 to-white/70 p-5 sm:p-6 shadow-[0_16px_45px_rgba(12,18,36,0.1)] animate-rise"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-base sm:text-lg font-semibold text-black">{feature.title}</p>
                      <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="flex flex-col items-center gap-4 sm:gap-6 text-center">
          <div className="space-y-3 sm:space-y-4 w-full max-w-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black">
              Stay Updated
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-zinc-700 px-2">
              Want to be notified when this feature launches? Join our community to get early access and updates.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="https://discord.gg/vS6gQZyNgT"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-black via-black to-zinc-800 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold uppercase tracking-wide text-white shadow-[0_15px_45px_rgba(12,18,36,0.18)] transition duration-150 hover:-translate-y-0.5 active:scale-95"
              >
                Join Discord Community
              </Link>
              <Link
                href="/dashboard/new"
                className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-black/20 bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold uppercase tracking-wide text-black transition duration-150 hover:border-black/40 hover:-translate-y-0.5 active:scale-95"
              >
                Try Current Scoreboards
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


