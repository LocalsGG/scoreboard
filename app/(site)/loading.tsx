function HomeSkeleton() {
  return (
    <div className="space-y-16 sm:space-y-20 lg:space-y-24">
      {/* Hero Section */}
      <section className="space-y-8 sm:space-y-12 lg:space-y-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="h-12 w-96 mx-auto bg-white/20 rounded-lg mb-6 animate-pulse"></div>
          <div className="h-6 w-3/4 mx-auto bg-white/20 rounded mb-4 animate-pulse"></div>
          <div className="h-6 w-1/2 mx-auto bg-white/20 rounded animate-pulse"></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="h-12 w-32 bg-white/20 rounded-lg animate-pulse"></div>
          <div className="h-12 w-32 bg-white/20 rounded-lg animate-pulse"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center">
          <div className="h-8 w-64 mx-auto bg-white/20 rounded mb-4 animate-pulse"></div>
          <div className="h-6 w-96 mx-auto bg-white/20 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-video bg-white/20 rounded-lg animate-pulse"></div>
              <div className="h-6 w-3/4 bg-white/20 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-white/20 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-white/20 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function HomeLoading() {
  return <HomeSkeleton />;
}

