import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NavActions } from "./NavActions";

export async function Navbar() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email ?? null;

  return (
    <nav className="flex w-full items-center justify-between py-3 text-sm font-semibold">
      <Link
        href="/"
        className="flex items-center gap-2 text-base font-extrabold tracking-tight text-black transition hover:text-zinc-700"
      >
        <img
          src="https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images/logo.svg"
          alt="Scoreboard logo"
          className="h-12 w-12"
        />
        Scoreboard
      </Link>
      <NavActions email={email} />
    </nav>
  );
}
