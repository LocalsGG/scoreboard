import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 flex justify-center px-4 py-8 sm:px-6 sm:py-12 md:py-16 font-sans">
        <div className="w-full max-w-6xl space-y-6 sm:space-y-8 animate-fade-in">
          <section className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-black/5 bg-white/80 p-6 sm:p-8 md:p-9 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur animate-rise">
            <header>
              <Skeleton className="h-8 sm:h-9 w-48 sm:w-56" />
            </header>
            <ul className="grid gap-3 sm:gap-4 text-sm sm:grid-cols-1 md:grid-cols-2">
              {[0, 1, 2].map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-black/8 bg-white/80 p-3 sm:p-4 shadow-sm shadow-black/5"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-full flex-shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-2.5 w-16 sm:w-20" />
                      <Skeleton className="h-4 sm:h-5 w-32 sm:w-40" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Skeleton className="h-2.5 w-12 hidden sm:block" />
                    <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex-shrink-0" />
                    <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex-shrink-0" />
                  </div>
                </li>
              ))}
              {/* Create tile skeleton */}
              <li className="flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-dashed border-black/20 bg-white/80 p-3 sm:p-4 shadow-sm shadow-black/5">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border border-dashed flex-shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-2.5 w-12" />
                    <Skeleton className="h-4 sm:h-5 w-36 sm:w-44" />
                  </div>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
