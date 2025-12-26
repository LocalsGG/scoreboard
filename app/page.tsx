import { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";

async function getSiteUrl(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    const forwardedHost = headersList.get('x-forwarded-host');
    const forwardedProto = headersList.get('x-forwarded-proto');
    const origin = headersList.get('origin');
    
    let requestOrigin = '';
    if (origin) {
      requestOrigin = origin;
    } else {
      const finalHost = forwardedHost || host;
      if (finalHost) {
        const protocol = forwardedProto 
          ? `${forwardedProto}://`
          : (process.env.NODE_ENV === 'production' ? 'https://' : 'http://');
        requestOrigin = `${protocol}${finalHost}`;
      }
    }

    if (requestOrigin) {
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        const envUrl = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
        try {
          const envUrlObj = new URL(envUrl);
          const requestUrlObj = new URL(requestOrigin);
          if (envUrlObj.hostname === requestUrlObj.hostname) {
            return envUrl;
          }
        } catch {
          // If URL parsing fails, use request origin
        }
      }
      return requestOrigin;
    }
  } catch {
    // Headers might not be available in all contexts
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  return 'https://scoreboardtools.com';
}

const HERO_SCOREBOARD_IMAGES = [
  "/scoreboard1.svg",
  "/scoreboard2.svg",
  "/scoreboard3.svg",
];

const getOBSOverlayExamples = () => {
  return [
    {
      title: "Live overlay in OBS",
      description:
        "Drop the Scoreboardtools link straight into OBS and the overlay updates the second you change the score.",
      src: "/1.webp",
    },
    {
      title: "Add language + context",
      description:
        "Customize labels, languages, and team details from any browser so viewers always know what they are watching.",
      src: "/2.webp",
    },
    {
      title: "Brand it with your logo",
      description:
        "Layer in team or sponsor logos right inside OBS while keeping the overlay synced to the live game.",
      src: "/3.webp",
    },
  ];
};

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  
  return {
    title: "Live Scoreboard Overlays | Stream The Score!",
    description:
      "Live scoreboard overlays for esports streaming. Add to any streaming solution—OBS, Streamlabs, vMix, Wirecast, and more. Easily share and update your scoreboard in real time. Perfect for esports tournaments and live streaming.",
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
      "scoreboard tools",
    ],
    alternates: {
      canonical: siteUrl || undefined,
    },
    openGraph: {
      title: "Live Scoreboard Overlays | Stream The Score! | Scoreboardtools",
      description:
        "Live scoreboard overlays for esports streaming. Add to any streaming solution and easily share and update your scoreboard in real time.",
      type: "website",
      siteName: "Scoreboardtools",
      url: siteUrl || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "Live Scoreboard Overlays | Stream The Score! | Scoreboardtools",
      description:
        "Live scoreboard overlays for esports streaming. Works with any streaming solution—OBS, Streamlabs, vMix, Wirecast, and more.",
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
  const siteUrl = await getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Scoreboardtools - Live Scoreboard Overlays",
    url: siteUrl || "https://scoreboardtools.com",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Live scoreboard overlays for esports streaming. Add to any streaming solution and easily share and update your scoreboard in real time.",
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
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mb-4 sm:mb-6">
            <Image
              src="/logo.svg"
              alt="Scoreboardtools logo"
              fill
              sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 192px"
              priority
              className="object-contain"
            />
          </div>
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
              Create live scoreboard overlays for esports streaming. Add to any streaming solution—OBS, Streamlabs, vMix, Wirecast, and more. Easily share and update your scoreboard in real time. No installs, runs from your browser.
            </p>
          </div>
        </section>

        <section className="w-full rounded-2xl sm:rounded-3xl border border-black/5 bg-white/80 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 shadow-xl shadow-black/10 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8 lg:gap-10 text-center">
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Live overlay preview
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black">
                Works with any streaming solution
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-zinc-700 px-2">
                Add Scoreboardtools to OBS, Streamlabs, vMix, Wirecast, or any streaming platform that supports browser sources. Every overlay is a single URL you can drag, resize, and brand just like any other scene. Easily share your scoreboard link and update scores in real time from any device.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 text-left grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {getOBSOverlayExamples().map((card, index) => (
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
                      loading={index === 0 ? undefined : "lazy"}
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
      </div>
    </main>
  );
}
