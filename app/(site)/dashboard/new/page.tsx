import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Template = {
  slug: string;
  name: string;
  icon: string;
};

const nextIcon = "/nextjs-icon.svg";

const gameTemplates: Template[] = [
  {
    slug: "melee",
    name: "Super Smash Bros. Melee",
    icon: "https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images/melee-icon.svg",
  },
  {
    slug: "ultimate",
    name: "Super Smash Bros. Ultimate",
    icon: "https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images/ultimate-icon.svg",
  },
  {
    slug: "guilty-gear-strive",
    name: "Guilty Gear Strive",
    icon: "https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images/guilty-icon.svg",
  },
  {
    slug: "generic",
    name: "Generic",
    icon: nextIcon,
  },
];

async function createBoard(formData: FormData) {
  "use server";

  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  const rawName = (formData.get("name") as string | null) ?? "";
  const name = rawName.trim() || "Untitled board";
  const shareToken = randomUUID().replace(/-/g, "");

  const { data, error } = await supabase
    .from("scoreboards")
    .insert({
      name,
      owner_id: session.user.id,
      share_token: shareToken,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Failed to create board", error.message);
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Board created without an id");
  }

  revalidatePath("/dashboard");
  redirect(`/scoreboard/${data.id}`);
}

export default async function NewScoreboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="flex min-h-full justify-center px-6 py-16 font-sans">
      <main className="w-full max-w-5xl space-y-10 animate-fade-in">
        <div className="flex justify-start">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 opacity-70 hover:opacity-100 active:scale-95"
            aria-label="Back to dashboard"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              &larr;
            </span>
            <span>Back to dashboard</span>
          </Link>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-9 shadow-sm animate-rise">
          <div className="grid gap-4 sm:grid-cols-2">
            {gameTemplates.map((template) => (
              <form key={template.slug} action={createBoard} className="h-full">
                <input type="hidden" name="name" value={template.name} />
                <button
                  type="submit"
                  className="group flex h-full w-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={template.icon}
                      alt={`${template.name} icon`}
                      width={32}
                      height={32}
                      className="h-8 w-8"
                      unoptimized
                    />
                    <h3 className="text-lg font-semibold text-black">
                      {template.name}
                    </h3>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-black transition group-hover:translate-x-0.5">
                    Start with this
                    <span aria-hidden>→</span>
                  </span>
                </button>
              </form>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
