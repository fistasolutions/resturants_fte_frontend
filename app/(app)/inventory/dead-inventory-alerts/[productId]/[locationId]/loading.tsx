import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the dead-inventory alert sub-page — breadcrumb, header, metric strip,
 * then the two detail sections, so loading reserves the final layout exactly. */
export default function DeadInventoryAlertDetailLoading() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <Skeleton className="h-3.5 w-80" />

      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      {/* Metric strip skeleton */}
      <div className="flex flex-wrap divide-y divide-border rounded-card bg-card ring-1 ring-foreground/10 sm:divide-x sm:divide-y-0">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex-1 basis-36 space-y-2 px-4 py-3">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>

      {/* Two detail cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="rounded-card bg-card px-4 py-3 ring-1 ring-foreground/10"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-48" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }, (_, row) => (
                <Skeleton key={row} className="h-6 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Status strip */}
      <Skeleton className="h-16 w-full rounded-card" />
    </main>
  );
}
