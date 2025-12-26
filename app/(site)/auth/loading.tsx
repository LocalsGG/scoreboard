function AuthSkeleton() {
  return (
    <div className="relative flex min-h-full items-center justify-center px-4 sm:px-6 py-8 sm:py-12 font-sans">
      <main className="relative z-10 w-full max-w-md animate-fade-in">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm animate-rise">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="h-8 w-32 bg-white/20 rounded mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 w-48 bg-white/20 rounded mx-auto animate-pulse"></div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <div className="h-4 w-16 bg-white/20 rounded mb-2 animate-pulse"></div>
              <div className="h-10 w-full bg-white/20 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-16 bg-white/20 rounded mb-2 animate-pulse"></div>
              <div className="h-10 w-full bg-white/20 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 space-y-3">
            <div className="h-10 w-full bg-white/20 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-white/20 rounded animate-pulse"></div>
          </div>

          {/* Links */}
          <div className="mt-6 text-center">
            <div className="h-4 w-40 bg-white/20 rounded mx-auto animate-pulse"></div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function AuthLoading() {
  return <AuthSkeleton />;
}
