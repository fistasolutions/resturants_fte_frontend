import { Skeleton } from "@/components/ui/skeleton";

/** Peak Hours content-only skeleton (SPEC-113) — insight tiles + heatmap + list. */
export default function PeakHoursLoading() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </>
  );
}
