import { Skeleton, SkeletonTextRow } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-full justify-center px-6 py-16 font-sans">
      <main className="w-full max-w-5xl space-y-8 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-9 shadow-sm animate-rise">
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid gap-4 rounded-xl border border-dashed border-black/20 bg-white p-4">
                <SkeletonTextRow />
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-7 w-14" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
