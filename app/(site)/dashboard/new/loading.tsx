import { Skeleton, SkeletonTextRow } from "@/components/Skeleton";

export default function NewDashboardLoading() {
  return (
    <div className="flex min-h-full justify-center px-6 py-16 font-sans">
      <main className="w-full max-w-5xl space-y-10 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white/70 p-9 shadow-sm animate-rise dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="flex h-full flex-col justify-between rounded-xl border border-zinc-200/80 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-950/60"
              >
                <SkeletonTextRow />
                <Skeleton className="mt-4 h-4 w-28" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
