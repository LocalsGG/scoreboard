import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HERO_SCOREBOARD_IMAGES } from "@/lib/assets";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/urls";
import { LifetimeDealBanner } from "@/components/LifetimeDealBanner";

const OBS_OVERLAY_EXAMPLES = [
  {
    title: "Live overlay in OBS",
    description:
      "Drop the Scoreboard.to link straight into OBS and the overlay updates the second you change the score.",
    src: "https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images/gif1.gif",
  },
  {
    title: "Add language + context",
    description:
      "Customize labels, languages, and team details from any browser so viewers always know what they are watching.",
    src: "https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images/gif2.gif",
  },
  {
    title: "Brand it with your logo",
    description:
      "Layer in team or sponsor logos right inside OBS while keeping the overlay synced to the live game.",
    src: "https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images/gif3.gif",
  },
];

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  
  return {
    title: "Live Scoreboard Overlays | Stream The Score! | Scoreboard.to",
    description:
      "Free live scoreboard overlays for streaming. Drop a single URL into OBS, Streamlabs, vMix, or Wirecast and keep every score updated in real time. Perfect for gamers, esports, and rec leagues. Stream the score!",
    keywords: [
      "live scoreboard",
      "scoreboard overlay",
      "OBS overlay",
      "streaming overlay",
      "live score",
      "esports scoreboard",
      "gaming scoreboard",
      "stream scoreboard",
      "OBS scoreboard",
      "Streamlabs overlay",
      "real-time scoreboard",
      "free scoreboard",
    ],
    alternates: {
      canonical: siteUrl || undefined,
    },
    openGraph: {
      title: "Live Scoreboard Overlays | Stream The Score!",
      description:
        "Free live scoreboard overlays for streaming. Drop a single URL into OBS, Streamlabs, vMix, or Wirecast and keep every score updated in real time.",
      type: "website",
      siteName: "Scoreboard.to",
      url: siteUrl || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "Live Scoreboard Overlays | Stream The Score!",
      description:
        "Free live scoreboard overlays for streaming. Perfect for OBS, Streamlabs, and more.",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

const splashImagePaddingTop =
  process.env.NEXT_PUBLIC_SPLASH_IMAGE_PADDING_TOP ?? "0px";
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Scoreboard.to - Live Scoreboard Overlays",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free live scoreboard overlays for streaming. Stream the score! Drop a single URL into OBS, Streamlabs, vMix, or Wirecast and keep every score updated in real time.",
    featureList: [
      "Live scoreboard overlays",
      "OBS integration",
      "Streamlabs integration",
      "Real-time score updates",
      "Browser-based - no installs",
      "Free to use",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      ratingCount: "1",
    },
  };

  return (
    <main className="relative isolate overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 sm:gap-10 lg:gap-16 px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-8 sm:pt-12">
        <section className="flex flex-col items-center gap-0">
          <div className="space-y-0.5 sm:space-y-1 text-center w-full max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black uppercase leading-tight tracking-tight text-black text-center">
              Live Scoreboard Overlays
            </h1>
            <p className="w-full text-sm sm:text-base lg:text-lg font-semibold text-zinc-700 text-center px-2">
              Stream The Score!
            </p>
          </div>
          <div className="relative w-full -my-8 sm:-my-12 lg:-my-16" style={{ paddingTop: splashImagePaddingTop }}>
            <div className="splash-marquee-wrapper">
              <div className="splash-marquee-track">
                {[...HERO_SCOREBOARD_IMAGES, ...HERO_SCOREBOARD_IMAGES].map(
                  (src, index) => (
                    <div key={`${src}-${index}`} className="splash-marquee-item">
                      <div className="relative w-full aspect-video">
                        <Image
                          src={src}
                          alt="Live scoreboard overlay for streaming - Real-time score display for OBS and Streamlabs"
                          fill
                          sizes="100vw"
                          priority={index === 0}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="space-y-0.5 sm:space-y-1 text-center w-full max-w-3xl">
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-zinc-800 text-center px-2">
              Share a live scoreboard link so family and fans can follow the game in real time. Use it on a stream, a TV,
              or just phones on the sideline. No installs, runs from your browser.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-black via-black to-zinc-800 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold uppercase tracking-wide text-white shadow-[0_15px_45px_rgba(12,18,36,0.18)] transition duration-150 hover:-translate-y-0.5 active:scale-95"
              >
                Create a Scoreboard for free
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full rounded-2xl sm:rounded-3xl border border-black/5 bg-white/80 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 shadow-xl shadow-black/10 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8 lg:gap-10 text-center">
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Live overlay preview
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black">
                Drop Scoreboard.to straight into OBS or Streamlabs
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-zinc-700 px-2">
                Every overlay is a single browser source so you can drag, resize, and brand it just like any other scene.
                Updates land instantly when you tweak scores from your phone or laptop.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 text-left grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {OBS_OVERLAY_EXAMPLES.map((card, index) => (
                <div
                  key={card.title}
                  className="flex h-full flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-black/8 bg-gradient-to-b from-white/90 to-white/70 p-4 sm:p-5 shadow-[0_16px_45px_rgba(12,18,36,0.1)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden rounded-lg sm:rounded-xl bg-black">
                    <Image
                      src={card.src}
                      alt={card.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      priority={index === 0}
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-black">{card.title}</p>
                    <p className="mt-1 text-xs sm:text-sm text-zinc-600">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full rounded-2xl sm:rounded-3xl border border-black/5 bg-white/80 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 shadow-xl shadow-black/10 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8 lg:gap-10 text-center">
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black">
                Choose Your Plan
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-zinc-700 px-2">
                Start free, upgrade anytime. All plans include no ads and real-time updates.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* Base Tier */}
              <div className="flex flex-col gap-4 sm:gap-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-black">Base</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-black">Free</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600">
                    Always free
                  </p>
                </div>
                <ul className="flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">Create up to 1 board</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">No ads, ever - clean viewing experience</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold mt-0.5">✗</span>
                    <span className="text-zinc-700">Match your brand with custom colors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold mt-0.5">✗</span>
                    <span className="text-zinc-700">Add team and sponsor logos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold mt-0.5">✗</span>
                    <span className="text-zinc-700">Invite team members to collaborate</span>
                  </li>
                </ul>
                <Link
                  href="/auth"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  Get Started
                </Link>
              </div>

              {/* Standard Tier */}
              <div className="flex flex-col gap-4 sm:gap-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-black">Standard</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-black">$20</span>
                    <span className="text-sm sm:text-base text-zinc-600">/ month</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600">
                    Billed monthly, cancel anytime
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 mb-2">
                  Everything in Base, and
                </p>
                <ul className="flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">Create up to 20 scoreboards</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">No ads, ever - clean viewing experience</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">Match your brand with custom colors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">Add team and sponsor logos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">Invite team members to collaborate</span>
                  </li>
                </ul>
                <Link
                  href="/pricing"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  Get Started
                </Link>
              </div>

              {/* Pro Tier - Center */}
              <div className="flex flex-col gap-4 sm:gap-6 rounded-lg border-2 border-black bg-black p-4 sm:p-6 lg:p-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold uppercase">
                  Popular
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-white">Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">$40</span>
                    <span className="text-sm sm:text-base text-zinc-300">/ month</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Billed monthly, cancel anytime
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 mb-2">
                  Everything in Standard, and
                </p>
                <ul className="flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold mt-0.5">✓</span>
                    <span className="text-white">Create up to 200 scoreboards</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold mt-0.5">✓</span>
                    <span className="text-white">No ads, ever - clean viewing experience</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold mt-0.5">✓</span>
                    <span className="text-white">Match your brand with custom colors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold mt-0.5">✓</span>
                    <span className="text-white">Add team and sponsor logos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold mt-0.5">✓</span>
                    <span className="text-white">Invite team members to collaborate</span>
                  </li>
                </ul>
                <Link
                  href="/pricing"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-black transition-colors hover:bg-zinc-100"
                >
                  Get Started
                </Link>
              </div>

              {/* Enterprise Tier */}
              <div className="flex flex-col gap-4 sm:gap-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-black">Enterprise</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-black">Let&apos;s talk</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600">
                    Custom solutions for your team
                  </p>
                </div>
                <ul className="flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">Unlimited scoreboards</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">Dedicated support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-zinc-700">SLA guarantees</span>
                  </li>
                </ul>
                <Link
                  href="mailto:contact@locals.gg"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-black transition-colors hover:bg-zinc-50"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <LifetimeDealBanner />
    </main>
  );
}
