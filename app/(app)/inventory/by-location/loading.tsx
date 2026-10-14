import { Skeleton } from "@/components/ui/skeleton";

/** By-Location skeleton (SPEC-100): the five company KPI tiles + the ranked
 * per-location table. Content-only — chrome is in the shell. */
export default function InventoryByLocationLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
