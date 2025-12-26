import { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
import ScoreboardMagic from "./components/ScoreboardMagic";

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

const getPricingPlans = () => {
  return [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      cta: "Get Started Free",
      ctaLink: "/signup",
      featured: false,
      features: [
        "Unlimited scoreboards",
        "Real-time updates",
        "Basic customization",
        "Works with all streaming platforms",
        "Share with team members",
        "Community support",
      ],
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "For serious streamers and tournaments",
      cta: "Start Pro Trial",
      ctaLink: "/signup?plan=pro",
      featured: true,
      features: [
        "Everything in Free",
        "Custom branding & logos",
        "Advanced customization",
        "Priority support",
        "API access",
        "Analytics & insights",
        "Team collaboration tools",
        "Custom domains",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large tournaments and organizations",
      cta: "Contact Sales",
      ctaLink: "/contact",
      featured: false,
      features: [
        "Everything in Pro",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom integrations",
        "White-label options",
        "Training & onboarding",
        "Volume discounts",
      ],
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


          {/* Scoreboard Magic Section */}
          <section id="see-it-work" className="w-full rounded-3xl border-2 border-black/10 bg-gradient-to-br from-white/95 to-white/70 px-6 sm:px-8 lg:px-12 py-14 sm:py-18 lg:py-24 shadow-2xl shadow-black/10 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 sm:gap-14 text-center">
              <div className="space-y-5">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <HiSparkles className="w-7 h-7 sm:w-9 sm:h-9 text-black" />
                  <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                    The Magic
                  </p>
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs font-black uppercase rounded-full tracking-wide">
                    Beta
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black">
                  Paste Your Stream. Watch Scores Update.
                </h2>
                <p className="text-lg sm:text-xl lg:text-2xl text-zinc-700 max-w-4xl mx-auto leading-relaxed">
                  Enter your livestream link and watch the magic happen. Scores update <span className="font-black text-black">auto-magically</span>— 
                  giving you more time to focus on what matters: <span className="font-semibold">commentating, callouts, and engaging with your audience</span>.
                </p>
                <p className="text-sm text-zinc-600 italic">
                  Currently in beta—help us improve by trying it out!
                </p>
              </div>
              
              <ScoreboardMagic />
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
                    <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mb-2 group-hover:bg-black/10 transition-colors">
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
                        <div className="flex items-center gap-3 mb-3">
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
          <section id="pricing" className="w-full">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14 sm:mb-18">
                <p className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">
                  Simple Pricing
                </p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black mb-6">
                  Start Free. Upgrade When Ready.
                </h2>
                <p className="text-lg sm:text-xl text-zinc-700 max-w-3xl mx-auto">
                  No credit card required. Cancel anytime. All plans include a 14-day free trial.
                </p>
              </div>

              <div className="grid gap-8 sm:gap-10 lg:gap-8 grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto">
                {getPricingPlans().map((plan, index) => (
                  <div
                    key={plan.name}
                    className={`relative flex flex-col rounded-3xl border-2 p-10 ${
                      plan.featured
                        ? "border-black bg-black text-white shadow-2xl scale-105 md:scale-110 z-10"
                        : "border-black/10 bg-white/80 backdrop-blur-sm"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-5 py-2 bg-white text-black text-xs font-black rounded-full uppercase tracking-wide">
                        Most Popular
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className={`text-3xl font-black mb-3 ${plan.featured ? "text-white" : "text-black"}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm mb-8 ${plan.featured ? "text-zinc-300" : "text-zinc-600"}`}>
                        {plan.description}
                      </p>
                      <div className="mb-8">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-6xl font-black ${plan.featured ? "text-white" : "text-black"}`}>
                            {plan.price}
                          </span>
                          {plan.period !== "forever" && plan.period !== "pricing" && (
                            <span className={`text-xl ${plan.featured ? "text-zinc-300" : "text-zinc-600"}`}>
                              /{plan.period}
                            </span>
                          )}
                        </div>
                        {plan.period === "forever" && (
                          <span className={`text-base ${plan.featured ? "text-zinc-300" : "text-zinc-600"}`}>
                            Free forever
                          </span>
                        )}
                      </div>
                      <ul className="space-y-4 mb-10">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <HiCheckCircle
                              className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                                plan.featured ? "text-white" : "text-black"
                              }`}
                            />
                            <span
                              className={`text-base leading-relaxed ${
                                plan.featured ? "text-zinc-200" : "text-zinc-700"
                              }`}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <a
                      href={plan.ctaLink}
                      className={`block w-full text-center px-8 py-5 rounded-2xl font-black text-lg transition-all duration-200 ${
                        plan.featured
                          ? "bg-white text-black hover:bg-zinc-100 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                          : "bg-black text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl"
                      }`}
                    >
                      {plan.cta}
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-14 text-center">
                <p className="text-base text-zinc-600 mb-6">
                  All plans include 14-day free trial • Cancel anytime • No hidden fees
                </p>
                <a
                  href="/contact"
                  className="text-base font-semibold text-black hover:underline inline-flex items-center gap-2"
                >
                  Need help choosing? Contact us
                  <HiArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </section>

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
