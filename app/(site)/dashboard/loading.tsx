function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 flex justify-center px-4 py-8 sm:px-6 sm:py-12 md:py-16 font-sans">
        <div className="w-full max-w-6xl space-y-6 sm:space-y-8 animate-fade-in">
          <section className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-black/5 bg-white/80 p-6 sm:p-8 md:p-9 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur animate-rise">
            <header className="flex items-center justify-between gap-4">
              <div className="h-8 w-48 bg-white/20 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-white/20 rounded animate-pulse"></div>
            </header>

            <div className="grid gap-3 sm:gap-4 text-sm sm:grid-cols-1 md:grid-cols-2">
              {/* Create new board card */}
              <div className="flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-dashed border-black/20 bg-white/80 p-3 sm:p-4 shadow-sm shadow-black/5">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 bg-white/20 rounded-full animate-pulse"></div>
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-8 bg-white/20 rounded mb-1 animate-pulse"></div>
                    <div className="h-4 w-32 bg-white/20 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Scoreboard cards */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm shadow-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-6 w-6 bg-white/20 rounded animate-pulse"></div>
                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-32 bg-white/20 rounded mb-2 animate-pulse"></div>
                        <div className="h-3 w-20 bg-white/20 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-white/20 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
