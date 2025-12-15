import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserData } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  const user = session.user;
  const isAnonymous = !user.email;
  
  // Fetch user data from public.users table (includes subscription status)
  const userData = !isAnonymous ? await getUserData(supabase, user.id) : null;
  const subscriptionStatus = userData?.subscription_status || 'base';

  return (
    <div className="flex min-h-full justify-center px-6 py-14 font-sans">
      <main className="w-full max-w-4xl space-y-8 animate-fade-in">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Account
          </p>
          <h1 className="text-4xl font-extrabold text-black dark:text-white">
            Account settings
          </h1>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white/70 p-8 shadow-sm animate-rise dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                {isAnonymous ? 'Account Type' : 'Email'}
              </p>
              <p className="text-base font-semibold text-black dark:text-white">
                {isAnonymous ? 'Guest Account' : user.email}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                User ID:{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                  {user.id}
                </code>
              </p>
              {isAnonymous && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You&apos;re signed in as a guest. Create an account to save your scoreboards permanently.
                </p>
              )}
              {!isAnonymous && (
                <div className="space-y-1 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Subscription
                  </p>
                  <p className="text-base font-semibold text-black dark:text-white capitalize">
                    {subscriptionStatus}
                  </p>
                </div>
              )}
            </div>
            {!isAnonymous && (
              <Link
                href="/auth/update-password"
                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)] transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)] active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Update password
              </Link>
            )}
          </div>

        </section>
      </main>
    </div>
  );
}
