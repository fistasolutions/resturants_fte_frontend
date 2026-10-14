import { Skeleton } from "@/components/ui/skeleton";

/** A panel-shaped placeholder: header bar, then `rows` hairline-divided rows. */
function PanelSkeleton({
  rows,
  rowHeight = "h-12",
  className = "",
}: {
  rows: number;
  rowHeight?: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
      <div className="flex h-10 items-center gap-3 border-b border-border px-4">
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 ${rowHeight}`}>
            <Skeleton className="size-2 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The Dashboard's pending state (SPEC-119, shared in SPEC-230): rendered by the
 * route's `loading.tsx` and by the client view while its first fetch is in flight,
 * so the first paint is identical either way. The header is painted by the shell
 * (SPEC-232); this is the shape of the page below it (SPEC-233) — two strips, then
 * two columns of panels — so nothing jumps when the data lands.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-8">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex h-10 items-center border-b border-border px-4">
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="m-4 h-52 rounded-lg" />
          </div>
          <PanelSkeleton rows={6} rowHeight="h-14" />
          {/* Recent orders fills the column (SPEC-287), so the first paint does too. */}
          <PanelSkeleton rows={8} rowHeight="h-10" className="min-h-80 lg:flex-1 lg:contain-size" />
        </div>
        <div className="space-y-4 lg:col-span-3">
          <PanelSkeleton rows={4} rowHeight="h-11" />
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={4} rowHeight="h-11" />
          <PanelSkeleton rows={5} rowHeight="h-11" />
        </div>
      </div>
    </div>
  );
}
