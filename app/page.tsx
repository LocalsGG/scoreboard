import { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PricingSection from "./components/PricingSection";
import { 
  HiBolt, 
  HiRocketLaunch, 
  HiGlobeAlt, 
  HiShare, 
  HiCheckCircle,
  HiPlay,
  HiLanguage,
  HiPhoto,
  HiSparkles,
  HiArrowRight
} from "react-icons/hi2";

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
      icon: HiPlay,
    },
    {
      title: "Add language + context",
      description:
        "Customize labels, languages, and team details from any browser so viewers always know what they are watching.",
      src: "/2.webp",
      icon: HiLanguage,
    },
    {
      title: "Brand it with your logo",
      description:
        "Layer in team or sponsor logos right inside OBS while keeping the overlay synced to the live game.",
      src: "/3.webp",
      icon: HiPhoto,
    },
  ];
};

const getBenefits = () => {
  return [
    {
      title: "Real-time updates",
      description: "Change scores instantly from any device. No delays, no lag—just seamless live updates.",
      icon: HiBolt,
    },
    {
      title: "Zero setup time",
      description: "Get started in seconds. No downloads, no plugins, no complicated configuration.",
      icon: HiRocketLaunch,
    },
    {
      title: "Works everywhere",
      description: "Compatible with OBS, Streamlabs, vMix, Wirecast, and any platform with browser sources.",
      icon: HiGlobeAlt,
    },
    {
      title: "Share instantly",
      description: "Send your scoreboard link to co-casters or producers. Everyone sees the same live data.",
      icon: HiShare,
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
    <>
      <Navbar />
      <main className="relative isolate overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col gap-12 sm:gap-16 lg:gap-24 px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 pt-10 sm:pt-14">
          
          {/* Hero Section */}
          <section className="flex flex-col items-center gap-8 sm:gap-10 text-center">
            <div className="space-y-4 sm:space-y-6 w-full max-w-6xl">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black uppercase leading-[0.95] tracking-tight text-black">
                Stop Managing Scores.
                <br />
                <span className="text-zinc-600">Start Streaming.</span>
              </h1>
              
              <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-700 max-w-4xl mx-auto leading-relaxed">
                Professional scoreboard overlays that update <span className="font-black text-black">auto-magically</span> from your livestream. 
                Focus on commentating, not scorekeeping.
              </p>
            </div>
            
            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-2xl">
              <a
                href="/signup"
                className="group w-full sm:w-auto px-10 py-5 bg-black text-white font-bold text-lg rounded-2xl hover:bg-zinc-800 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-center flex items-center justify-center gap-2"
              >
                <span>Start Free — No Credit Card</span>
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#see-it-work"
                className="w-full sm:w-auto px-10 py-5 bg-white text-black font-bold text-lg rounded-2xl border-2 border-black hover:bg-zinc-50 transition-all duration-200 text-center"
              >
                See It Work
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-zinc-600">
              <div className="flex items-center gap-2">
                <HiCheckCircle className="w-5 h-5 text-green-600" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <HiCheckCircle className="w-5 h-5 text-green-600" />
                <span>Setup in 60 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <HiCheckCircle className="w-5 h-5 text-green-600" />
                <span>No credit card required</span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative w-full -my-6 sm:-my-10 lg:-my-16" style={{ paddingTop: splashImagePaddingTop }}>
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
          </section>


          {/* Benefits Section */}
          <section className="w-full">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black mb-4">
                Everything You Need. Nothing You Don't.
              </h2>
              <p className="text-lg sm:text-xl text-zinc-700 max-w-3xl mx-auto">
                Built for streamers who want professional results without the complexity.
              </p>
            </div>
            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {getBenefits().map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="flex flex-col gap-4 p-8 rounded-3xl bg-white/60 border border-black/5 backdrop-blur-sm hover:bg-white/90 hover:border-black/10 transition-all duration-200 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mb-2 group-hover:bg-black/10 transition-colors" suppressHydrationWarning>
                      <IconComponent className="w-7 h-7 text-black" />
                    </div>
                    <h3 className="text-xl font-black text-black">{benefit.title}</h3>
                    <p className="text-sm text-zinc-600 leading-relaxed">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="w-full rounded-3xl border border-black/5 bg-white/80 px-6 sm:px-8 lg:px-12 py-14 sm:py-18 lg:py-24 shadow-xl shadow-black/10 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 sm:gap-14 text-center">
              <div className="space-y-5">
                <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Simple Setup
                </p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black">
                  Works with Any Streaming Platform
                </h2>
                <p className="text-lg sm:text-xl lg:text-2xl text-zinc-700 max-w-4xl mx-auto leading-relaxed">
                  Add Scoreboardtools to OBS, Streamlabs, vMix, Wirecast, or any platform that supports browser sources. 
                  Every overlay is a single URL—drag, resize, and brand just like any other scene.
                </p>
              </div>
              <div className="grid gap-8 sm:gap-10 text-left grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {getOBSOverlayExamples().map((card, index) => {
                  const IconComponent = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="flex h-full flex-col gap-5 rounded-3xl border border-black/8 bg-gradient-to-b from-white/95 to-white/80 p-8 shadow-lg hover:shadow-2xl transition-all duration-200 group"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-black group-hover:scale-[1.02] transition-transform duration-200">
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
                        <div className="flex items-center gap-3 mb-3" suppressHydrationWarning>
                          <IconComponent className="w-6 h-6 text-black" />
                          <h3 className="text-xl font-black text-black">{card.title}</h3>
                        </div>
                        <p className="text-base text-zinc-600 leading-relaxed">{card.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>


          {/* Pricing Section */}
          <PricingSection />

          {/* Final CTA Section */}
          <section className="w-full rounded-3xl border-2 border-black bg-gradient-to-br from-black via-zinc-900 to-black px-6 sm:px-8 lg:px-12 py-20 sm:py-24 lg:py-32 text-center shadow-2xl">
            <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight">
                Ready to Stream Like a Pro?
              </h2>
              <p className="text-xl sm:text-2xl lg:text-3xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
                Create professional scoreboard overlays for your streams and tournaments. 
                Free to start, powerful enough for the biggest events.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 items-center justify-center pt-6">
                <a
                  href="/signup"
                  className="group w-full sm:w-auto px-12 py-6 bg-white text-black font-black text-xl rounded-2xl hover:bg-zinc-100 transition-all duration-200 shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transform hover:-translate-y-1 text-center flex items-center justify-center gap-3"
                >
                  <span>Create Free Account</span>
                  <HiArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <HiCheckCircle className="w-5 h-5" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiCheckCircle className="w-5 h-5" />
                  <span>Setup in 60 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiCheckCircle className="w-5 h-5" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
