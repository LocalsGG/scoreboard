import { Skeleton } from "@/components/Skeleton";

export default function SharedScoreboardLoading() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-5xl animate-fade-in">
        <div className="aspect-[1440/810] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm animate-rise">
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-[60%] w-[75%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
