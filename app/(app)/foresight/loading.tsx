import { Skeleton } from "@/components/ui/skeleton";

/** Profit Lens content skeleton (SPEC-152) — the shell paints the header + tabs. */
export default function ForesightProfitLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
      <Skeleton className="h-72 w-full rounded-card" />
    </div>
  );
}
