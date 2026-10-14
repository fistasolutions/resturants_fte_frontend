import { Skeleton } from "@/components/ui/skeleton";

/** Suspense fallback for the combined money-leak + AI commentary section
 * (perf fix) — covers both cards while the LLM-backed panel resolves,
 * independent of the fast analytics data rendered above it. */
export function MoneyLeakSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
      <div className="space-y-2 rounded-2xl border border-border p-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </div>
  );
}
