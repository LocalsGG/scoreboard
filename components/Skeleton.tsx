type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`skeleton-shimmer rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70 ${className}`}
    />
  );
}

export function SkeletonTextRow() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}
