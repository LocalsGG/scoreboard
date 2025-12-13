import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Template = {
  slug: string;
  name: string;
  description: string;
};

const esportsTemplates: Template[] = [
  {
    slug: "melee",
    name: "Super Smash Bros. Melee",
    description: "Track sets, stocks, and rivalries from the GameCube classic.",
  },
  {
    slug: "ultimate",
    name: "Super Smash Bros. Ultimate",
    description: "Follow tournaments, pools, and friendlies across fighters.",
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black">
              Create
            </p>
            <h1 className="text-4xl font-extrabold text-black">
              Create a new scoreboard
            </h1>
            <p className="text-sm text-black">
              Pick a template to set up your board. We&apos;ll handle the rest.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
          >
            Back to dashboard
          </Link>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-9 shadow-sm animate-rise">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black">
                Esports
              </p>
              <p className="text-lg font-semibold text-black">
                Choose a Smash title
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {esportsTemplates.map((template) => (
              <form key={template.slug} action={createBoard} className="h-full">
                <input type="hidden" name="name" value={template.name} />
                <button
                  type="submit"
                  className="group flex h-full w-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                >
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-black">
                      Esports
                    </p>
                    <h3 className="text-lg font-semibold text-black">
                      {template.name}
                    </h3>
                    <p className="text-sm text-black">
                      {template.description}
                    </p>
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
