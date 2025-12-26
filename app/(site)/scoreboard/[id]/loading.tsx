function ScoreboardSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-16 z-20 border-b border-black/5 bg-white/80 px-4 py-3 sm:px-6 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-white/20 rounded animate-pulse"></div>
            <div className="h-6 w-24 bg-white/20 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Scoreboard Preview Skeleton */}
        <div className="relative z-0 -my-4 sm:-my-6 lg:-my-8">
          <div className="flex justify-center p-8">
            <div className="w-full max-w-4xl">
              <div className="aspect-video bg-white/20 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Controls Panel Skeleton */}
        <section className="space-y-6 sm:space-y-8 mt-6 sm:mt-8 px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-black/5 bg-white/80 p-4 sm:p-6 lg:p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)]">
            {/* Header */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
              <div className="h-6 w-6 bg-white/20 rounded animate-pulse"></div>
            </div>

            <div className="space-y-6">
              {/* Scoreboard Name */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-md">
                  <div className="h-8 w-48 bg-white/20 rounded mx-auto animate-pulse"></div>
                </div>
              </div>

              {/* Score Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-3 items-start">
                {/* A Side */}
                <div className="space-y-2 min-w-0">
                  <div className="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                  <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                </div>

                {/* A Score */}
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center justify-between rounded-md border border-black/20 bg-white px-2 py-2">
                    <div className="h-6 w-8 bg-white/20 rounded animate-pulse"></div>
                    <div className="h-8 w-12 bg-white/20 rounded animate-pulse"></div>
                    <div className="h-6 w-8 bg-white/20 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Logo */}
                <div className="space-y-2 flex flex-col items-center min-w-0">
                  <div className="h-12 w-12 bg-white/20 rounded animate-pulse"></div>
                </div>

                {/* B Score */}
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center justify-between rounded-md border border-black/20 bg-white px-2 py-2">
                    <div className="h-6 w-8 bg-white/20 rounded animate-pulse"></div>
                    <div className="h-8 w-12 bg-white/20 rounded animate-pulse"></div>
                    <div className="h-6 w-8 bg-white/20 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* B Side */}
                <div className="space-y-2 min-w-0">
                  <div className="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                  <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="grid grid-cols-3 items-end gap-4">
                <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
                <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ScoreboardLoading() {
  return <ScoreboardSkeleton />;
}
