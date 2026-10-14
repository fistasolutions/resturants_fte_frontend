import { Skeleton } from "@/components/ui/skeleton";

/**
 * Content-only skeleton for Dead Inventory (SPEC-085) — summary strip + dense
 * table. The header and tab bar come from the persistent inventory shell and
 * stay painted, so this fills only the content area with zero layout shift.
 */
export default function DeadInventoryAlertsLoading() {
  return (
    <>
      {/* Summary strip — single bordered band with 4 equal cells */}
      <div className="flex flex-wrap divide-y divide-border rounded-card bg-card ring-1 ring-foreground/10 sm:divide-x sm:divide-y-0">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex-1 basis-36 space-y-2 px-4 py-3">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>

      {/* Dense table skeleton */}
      <div className="overflow-hidden rounded-card ring-1 ring-foreground/10">
        <div className="space-y-px bg-card p-2">
          <Skeleton className="h-9 w-full rounded-md" />
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </>
  );
}
