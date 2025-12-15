import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserData } from "@/lib/users";
import { NavActions } from "./NavActions";

export async function Navbar() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email ?? null;
  const isGuest = !!session && !email;
  const isAuthenticated = !!session && !!email;
  
  // Get subscription status - only for authenticated (non-guest) users
  let subscriptionStatus: "base" | "standard" | "pro" | "lifetime" | null = null;
  if (isAuthenticated && session?.user?.id) {
    const userData = await getUserData(supabase, session.user.id);
    const status = userData?.subscription_status;
    if (status === "lifetime") {
      subscriptionStatus = "lifetime";
    } else if (status === "pro") {
      subscriptionStatus = "pro";
    } else if (status === "standard") {
      subscriptionStatus = "standard";
    } else {
      // Authenticated but not paid - show base badge
      subscriptionStatus = "base";
    }
  }

  const badgeLabels: Record<"base" | "standard" | "pro" | "lifetime", string> = {
    base: "Base",
    standard: "Standard",
    pro: "Pro",
    lifetime: "Lifetime Deal",
  };

  const badgeStyles: Record<"base" | "standard" | "pro" | "lifetime", string> = {
    base: "bg-zinc-100 text-zinc-700 border-zinc-200",
    standard: "bg-blue-50 text-blue-700 border-blue-200",
    pro: "bg-orange-50 text-orange-700 border-orange-200",
    lifetime: "bg-orange-100 text-orange-800 border-orange-300",
  };

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
        {/* Subscription Badge - only show for authenticated (non-guest) users */}
        {isAuthenticated && subscriptionStatus !== null && (
          <span
            className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStyles[subscriptionStatus]}`}
          >
            {badgeLabels[subscriptionStatus]}
          </span>
        )}
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
