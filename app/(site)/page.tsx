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
      <div className="mx-auto flex min-h-screen w-full max-w-none flex-col gap-8 sm:gap-16 px-4 sm:px-6 pb-16 pt-12">
        <section className="flex flex-col items-center gap-10">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-black uppercase leading-tight tracking-tight text-black sm:text-5xl lg:text-6xl text-center">
              Keep every stream&apos;s score in sync
            </h1>
            <p className="w-full text-base font-semibold text-zinc-700 text-center sm:text-lg">
              Drop one URL into OBS, Streamlabs, vMix, or Wirecast and watch updates land in milliseconds.
            </p>
          </div>
          <div className="relative w-full" style={{ paddingTop: splashImagePaddingTop }}>
            <div className="splash-marquee-wrapper w-full overflow-hidden">
              <div className="splash-marquee-track">
                {[...HERO_SCOREBOARD_IMAGES, ...HERO_SCOREBOARD_IMAGES].map(
                  (src, index) => (
                    <div key={`${src}-${index}`} className="splash-marquee-item">
                      <Image
                        src={src}
                        alt="Scoreboard overlay"
                        width={1280}
                        height={720}
                        priority={index === 0}
                        className="h-auto w-full"
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6 text-center">
            <p className="max-w-2xl text-lg text-zinc-800 text-center sm:text-xl">
              Share a live scoreboard link so family and fans can follow the game in real time. Use it on a stream, a TV,
              or just phones on the sideline. No installs, runs from your browser.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-black via-black to-zinc-800 px-6 py-3 text-base font-semibold uppercase tracking-wide text-white shadow-[0_15px_45px_rgba(12,18,36,0.18)] transition duration-150 hover:-translate-y-0.5 active:scale-95"
              >
                Create a Scoreboard
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full rounded-3xl border border-black/5 bg-white/80 px-4 sm:px-6 py-10 shadow-xl shadow-black/10 backdrop-blur">
          <div className="mx-auto flex w-full max-w-full flex-col gap-8 text-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Live overlay preview
              </p>
              <h2 className="text-3xl font-black text-black sm:text-4xl">
                Drop Scoreboard.to straight into OBS or Streamlabs
              </h2>
              <p className="text-base text-zinc-700 sm:text-lg">
                Every overlay is a single browser source so you can drag, resize, and brand it just like any other scene.
                Updates land instantly when you tweak scores from your phone or laptop.
              </p>
            </div>
            <div className="grid gap-6 text-left lg:grid-cols-3 md:grid-cols-2">
              {OBS_OVERLAY_EXAMPLES.map((card, index) => (
                <div
                  key={card.title}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-black/8 bg-gradient-to-b from-white/90 to-white/70 p-5 shadow-[0_16px_45px_rgba(12,18,36,0.1)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
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
                    <p className="text-base font-semibold text-black">{card.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">{card.description}</p>
                  </div>
                </div>
              ))}
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/15 bg-gradient-to-b from-white/90 to-white/70 p-6 text-center shadow-[0_16px_45px_rgba(12,18,36,0.08)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-white text-3xl font-bold text-black shadow-sm shadow-black/10">
                  +
                </div>
                <p className="text-base font-semibold text-black">
                  Let us know what games you&apos;d like us to support!
                </p>
                <p className="text-sm text-zinc-600">
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
