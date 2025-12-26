function NewDashboardSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 flex justify-center px-4 py-8 sm:px-6 sm:py-12 md:py-16 font-sans">
        <div className="w-full max-w-2xl space-y-6 sm:space-y-8 animate-fade-in">
          <section className="space-y-6 rounded-2xl sm:rounded-3xl border border-black/5 bg-white/80 p-6 sm:p-8 md:p-9 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur animate-rise">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="h-8 w-64 bg-white/20 rounded mx-auto animate-pulse"></div>
              <div className="h-4 w-96 bg-white/20 rounded mx-auto animate-pulse"></div>
            </div>

            {/* Template Selection */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex h-full w-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 text-left">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 bg-white/20 rounded animate-pulse"></div>
                      <div className="h-5 w-24 bg-white/20 rounded animate-pulse"></div>
                    </div>
                    <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <div className="h-4 w-20 bg-white/20 rounded mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-white/20 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 w-24 bg-white/20 rounded mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-white/20 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <div className="h-10 flex-1 bg-white/20 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-white/20 rounded animate-pulse"></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function NewDashboardLoading() {
  return <NewDashboardSkeleton />;
}
