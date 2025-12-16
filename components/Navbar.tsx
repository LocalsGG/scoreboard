import Image from "next/image";
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
    <nav className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold">
      <Link
        href="/"
        className="group flex items-center gap-3 rounded-full px-2 text-base font-extrabold tracking-tight text-black transition hover:text-zinc-700"
      >
        <Image
          src="https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images/logo.svg"
          alt="Scoreboard logo"
          width={40}
          height={40}
          className="h-10 w-10 transition-transform duration-150 group-hover:scale-105"
        />
        <span className="leading-none">
          Scoreboard
          <span className="hidden sm:block text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Live overlays
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Navigation Links - visible on all screens */}
        <Link
          href="/pricing"
          className="flex items-center gap-1.5 text-sm font-semibold text-black transition-colors hover:text-zinc-700"
        >
          Pricing
        </Link>
        <NavActions email={email} />
      </div>
    </nav>
  );
}
