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
    <main className="flex min-h-screen flex-col items-center justify-start gap-8 px-6 pb-12 pt-10 text-center font-sans">
        <div className="flex w-full max-w-3xl flex-col items-center gap-2">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black sm:text-5xl">
            Keep every stream's score in sync anywhere
            <span className="mt-2 block text-base font-semibold normal-case tracking-normal text-zinc-700 sm:text-lg">
              Scoreboard overlay and sharing that just works
            </span>
          </h1>
        </div>
        <div
          className="relative w-screen max-w-none -mx-6 sm:-mx-12"
          style={{ paddingTop: splashImagePaddingTop }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-transparent">
            <div className="splash-marquee-wrapper">
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
        </div>
        <div className="flex w-full max-w-3xl flex-col items-center gap-3">
          <p className="max-w-3xl text-lg text-black sm:text-xl">
            Share a live scoreboard link so family and fans can follow the game in real time. Use it on a stream, a TV,
            or just phones on the sideline. No installs, runs from your browser.
          </p>
          <Link
            href="/auth"
            className="inline-flex w-full max-w-sm items-center justify-center rounded-xl bg-black px-7 py-3.5 text-base font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-zinc-900"
          >
            Create a Scoreboard for Free
          </Link>
        </div>
      <section className="w-screen max-w-none -mx-6 sm:-mx-12">
        <div className="w-full bg-transparent px-6 py-12 sm:px-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 text-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Live overlay preview
              </p>
              <h2 className="mt-2 text-3xl font-black text-black">
                Drop Scoreboard.to straight into OBS or Streamlabs
              </h2>
              <p className="mt-3 text-base text-zinc-700">
                Every overlay is a single browser source so you can drag, resize, and brand it just like any other scene.
              </p>
            </div>
            <div className="grid gap-8 text-left sm:grid-cols-1 md:grid-cols-2">
              {OBS_OVERLAY_EXAMPLES.map((card, index) => (
                <div
                  key={card.title}
                  className="flex h-full flex-col gap-4 rounded-3xl border border-black/10 bg-transparent p-6 shadow-sm"
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
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-black/20 bg-transparent p-6 text-center shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-transparent text-3xl font-bold text-black">
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
                  and let us know which games you'd like us to support!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
