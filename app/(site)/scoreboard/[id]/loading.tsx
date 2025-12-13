import { Skeleton, SkeletonTextRow } from "@/components/Skeleton";

export default function ScoreboardLoading() {
  return (
    <div className="flex min-h-full justify-center px-6 py-16 font-sans">
      <main className="w-full max-w-5xl space-y-10 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm animate-rise">
          <div className="aspect-[1440/810] w-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-[60%] w-[70%]" />
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm animate-rise">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-16" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm animate-rise">
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4"
              >
                <SkeletonTextRow />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
