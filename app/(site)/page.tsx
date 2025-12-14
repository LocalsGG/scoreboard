import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HERO_SCOREBOARD_IMAGES } from "@/lib/assets";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
export const metadata: Metadata = {
  title: "Scoreboard.to | Live score overlays for gaming and esports",
  description:
    "Drop a single URL into OBS, Streamlabs, vMix, or Wirecast and keep every score updated in real time. Built for gamers, esports, and rec leagues.",
};

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

  return (
    <main className="relative isolate overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 sm:gap-10 lg:gap-16 px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-8 sm:pt-12">
        <section className="flex flex-col items-center gap-0">
          <div className="space-y-0.5 sm:space-y-1 text-center w-full max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black uppercase leading-tight tracking-tight text-black text-center">
              Free scoreboard overlays!
            </h1>
            <p className="w-full text-sm sm:text-base lg:text-lg font-semibold text-zinc-700 text-center px-2">
              keep every stream&apos;s score in sync
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
                          alt="Scoreboard overlay"
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
                Create a Scoreboard
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
              <div className="flex h-full flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-dashed border-black/15 bg-gradient-to-b from-white/90 to-white/70 p-5 sm:p-6 text-center shadow-[0_16px_45px_rgba(12,18,36,0.08)]">
                <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border border-black/10 bg-white text-2xl sm:text-3xl font-bold text-black shadow-sm shadow-black/10">
                  +
                </div>
                <p className="text-sm sm:text-base font-semibold text-black">
                  Let us know what games you&apos;d like us to support!
                </p>
                <p className="text-xs sm:text-sm text-zinc-600 px-2">
                  Send us an email{" "}
                  <a
                    href="mailto:contact@locals.gg"
                    className="font-semibold text-black underline hover:text-zinc-700"
                  >
                    contact@locals.gg
                  </a>{" "}
                  and let us know which games you&apos;d like us to support!
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
