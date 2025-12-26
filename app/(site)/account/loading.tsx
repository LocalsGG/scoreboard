function AccountSkeleton() {
  return (
    <div className="flex min-h-full justify-center px-6 py-14 font-sans">
      <main className="w-full max-w-4xl space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-white/20 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-white/20 rounded animate-pulse"></div>
        </div>

        {/* Profile Section */}
        <section className="space-y-6 rounded-2xl border border-black/5 bg-white/80 p-6 shadow-[0_22px_65px_rgba(12,18,36,0.12)] animate-rise">
          <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/20 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-5 w-32 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 w-40 bg-white/20 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="space-y-6 rounded-2xl border border-black/5 bg-white/80 p-6 shadow-[0_22px_65px_rgba(12,18,36,0.12)] animate-rise">
          <div className="h-6 w-40 bg-white/20 rounded animate-pulse"></div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-black/5 rounded-lg">
              <div className="space-y-2">
                <div className="h-5 w-24 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-white/20 rounded animate-pulse"></div>
          </div>
        </section>

        {/* Settings Section */}
        <section className="space-y-6 rounded-2xl border border-black/5 bg-white/80 p-6 shadow-[0_22px_65px_rgba(12,18,36,0.12)] animate-rise">
          <div className="h-6 w-24 bg-white/20 rounded animate-pulse"></div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-4 w-20 bg-white/20 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-12 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-white/20 rounded animate-pulse"></div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function AccountLoading() {
  return <AccountSkeleton />;
}
