import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Signed-in users should land on the dashboard instead of seeing auth UI.
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-full items-center justify-center px-4 sm:px-6 py-12 font-sans">
      <main className="relative z-10 w-full max-w-sm animate-fade-in">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm animate-rise">
          <AuthForm />
        </section>
      </main>
    </div>
  );
}
