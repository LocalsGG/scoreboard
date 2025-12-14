import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ convert?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const params = await searchParams;
  const isConverting = params.convert === 'true';

  // Log server-side session check
  console.log('[AuthPage] Server-side session check:', {
    hasSession: !!session,
    hasEmail: !!session?.user?.email,
    email: session?.user?.email || null,
    userId: session?.user?.id || null,
    isAnonymous: session?.user && !session?.user?.email,
    isConverting,
    error: sessionError?.message || null,
  });

  // Allow anonymous users to access auth page for conversion
  // Redirect authenticated (non-anonymous) users to dashboard
  // This handles OAuth callbacks - if user is authenticated, redirect to dashboard
  if (session && session.user.email && !isConverting) {
    console.log('[AuthPage] Redirecting to dashboard (server-side)');
    redirect("/dashboard");
  } else {
    console.log('[AuthPage] Not redirecting - showing auth form');
  }

  return (
    <div className="relative flex min-h-full items-center justify-center px-4 sm:px-6 py-12 font-sans">
      <main className="relative z-10 w-full max-w-sm animate-fade-in">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm animate-rise">
          <AuthForm isConverting={isConverting} />
        </section>
      </main>
    </div>
  );
}
