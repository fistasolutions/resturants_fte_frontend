import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton for the Spotlight tabs (SPEC-109). Used by the route
 * `loading.tsx` (first navigation) and the in-page keyed `<Suspense>` fallback
 * (tab switches). Header + tab bar stay painted in the persistent shell. */
export function SpotlightContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
