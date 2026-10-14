import { Skeleton } from "@/components/ui/skeleton";

/** The Fit tab's shape while it loads: tiles, the vendor table, the styles table. */
export function FitSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading fit">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      <Skeleton className="h-64 rounded-card" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-[480px] rounded-card" />
    </div>
  );
}

/** A style page's shape, header included — the page owns its header. */
export function FitStyleSkeleton() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6" aria-busy="true" aria-label="Loading the style">
      <Skeleton className="h-4 w-64 rounded-md" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-16 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-72 max-w-full rounded-md" />
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-32 rounded-card" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-card" />
    </main>
  );
}
