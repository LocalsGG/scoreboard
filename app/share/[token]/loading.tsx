import { Skeleton } from "@/components/Skeleton";

export default function SharedScoreboardLoading() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-5xl animate-fade-in">
        <div className="aspect-[1440/810] overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-100/80 shadow-sm animate-rise dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-[60%] w-[75%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
