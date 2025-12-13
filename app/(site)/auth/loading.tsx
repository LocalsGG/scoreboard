import { Skeleton } from "@/components/Skeleton";

export default function AuthLoading() {
  return (
    <div className="relative flex min-h-full items-center justify-center px-6 py-12 font-sans">
      <main className="relative z-10 w-full max-w-xl animate-fade-in">
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm animate-rise">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </section>
      </main>
    </div>
  );
}
