import { Metadata } from "next";
import { PasswordUpdate } from "@/components/PasswordUpdate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Update Password",
  description: "Update your Scoreboardtools account password securely.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-full justify-center px-6 py-14 font-sans">
      <main className="w-full max-w-4xl space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Security
          </p>
          <h1 className="text-4xl font-extrabold text-black dark:text-white">
            Update your password
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Open this page from the reset link so the temporary session is active. We never accept passwords without a valid session.
          </p>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white/70 p-8 dark:border-zinc-800 dark:bg-zinc-950/60">
          <PasswordUpdate />
        </section>
      </main>
    </div>
  );
}
