import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton for the Returns tabs (SPEC-095). Used both by the route
 * `loading.tsx` (first navigation) and by the in-page keyed `<Suspense>` fallback
 * (tab / date-range switches, which are searchParam changes the route loader
 * doesn't cover). Header + tab bar stay painted in the persistent shell. */
export function ReturnsContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
