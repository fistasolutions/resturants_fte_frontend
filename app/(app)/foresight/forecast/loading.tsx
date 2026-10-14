import { Skeleton } from "@/components/ui/skeleton";

/** Forecast content skeleton (SPEC-153) — shell paints header + tabs. */
export default function ForesightForecastLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-20 w-full rounded-card" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
    </div>
  );
}
