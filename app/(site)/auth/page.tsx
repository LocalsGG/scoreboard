import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Scoreboardtools to create and manage your live scoreboard overlays for streaming.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ convert?: string; redirect?: string; plan?: string; isAnnual?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const params = await searchParams;
  const isConverting = params.convert === 'true';
  const redirectTo = params.redirect;
  const plan = params.plan;
  const isAnnual = params.isAnnual === 'true';

  if (session?.user?.email && !isConverting && !redirectTo) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-full items-center justify-center px-4 sm:px-6 py-8 sm:py-12 font-sans">
      <main className="relative z-10 w-full max-w-md animate-fade-in">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm animate-rise">
          <AuthForm 
            isConverting={isConverting} 
            redirectTo={redirectTo}
            plan={plan}
            isAnnual={isAnnual}
          />
        </section>
      </main>
    </div>
  );
}
