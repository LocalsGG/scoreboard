import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NavActions } from "./NavActions";
import { MobileMenu } from "./MobileMenu";

export async function Navbar() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email ?? null;
  const isGuest = !!session && !email;

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
      <div className="flex items-center gap-3">
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 text-sm font-semibold text-black transition-colors hover:text-zinc-700"
          >
            {(email || isGuest) && (
              <svg
                className="w-4 h-4 text-orange-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            {isGuest ? 'Upgrade to save your boards' : email ? 'Upgrade for more boards' : 'Pricing'}
          </Link>
        </div>
        <NavActions email={email} />
        {/* Mobile Menu */}
        <MobileMenu email={email} isGuest={isGuest} />
      </div>
    </nav>
  );
}
