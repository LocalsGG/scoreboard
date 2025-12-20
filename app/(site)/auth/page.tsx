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
  searchParams: Promise<{ convert?: string; redirect?: string; redirectTo?: string; plan?: string; isAnnual?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const isConverting = params.convert === 'true';
  const redirectParam = params.redirect; // 'pricing' or undefined
  const redirectTo = params.redirectTo; // actual URL path like '/scoreboard/123'
  // If redirectParam is 'pricing', we need to pass both redirectParam and redirectTo
  // Otherwise, use redirectTo if it exists, or redirectParam if it's a path
  const finalRedirectTo = redirectParam === 'pricing' ? redirectParam : (redirectTo || redirectParam);
  const plan = params.plan;
  const isAnnual = params.isAnnual === 'true';

  // Only redirect if user has email (not anonymous) and not converting and no redirectTo
  const isAnonymous = user && !user.email;
  if (user && !isAnonymous && !isConverting && !finalRedirectTo) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-full items-center justify-center px-4 sm:px-6 py-8 sm:py-12 font-sans">
      <main className="relative z-10 w-full max-w-md animate-fade-in">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm animate-rise">
          <AuthForm 
            isConverting={isConverting} 
            redirectTo={finalRedirectTo}
            plan={plan}
            isAnnual={isAnnual}
            finalRedirectTo={redirectTo} // Pass the actual redirect URL separately when redirect is 'pricing'
          />
        </section>
      </main>
    </div>
  );
}
