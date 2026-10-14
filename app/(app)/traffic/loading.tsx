import { Skeleton } from "@/components/ui/skeleton";

/** Overview content-only skeleton (SPEC-112) — chrome (header/tabs) is painted
 * by the shell, so this mirrors just the hero + KPI band + chart panels. */
export default function TrafficOverviewLoading() {
  return (
    <>
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </>
  );
}
