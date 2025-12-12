import { Skeleton, SkeletonTextRow } from "@/components/Skeleton";

export default function AccountLoading() {
  return (
    <div className="flex min-h-full justify-center px-6 py-14 font-sans">
      <main className="w-full max-w-4xl space-y-8 animate-fade-in">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-56" />
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white/70 p-8 shadow-sm animate-rise dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SkeletonTextRow />
            <Skeleton className="h-10 w-40" />
          </div>
        </section>
      </main>
    </div>
  );
}
