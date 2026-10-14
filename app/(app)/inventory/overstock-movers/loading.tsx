import { Skeleton } from "@/components/ui/skeleton";

/** Overstock & Movers skeleton (SPEC-100): overstock + fast + slow tables in a
 * two-column grid. Content-only — chrome is in the shell. */
export default function InventoryOverstockMoversLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-72 rounded-2xl" />
      ))}
    </div>
  );
}
