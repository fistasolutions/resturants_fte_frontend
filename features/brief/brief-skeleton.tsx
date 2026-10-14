import { Skeleton } from "@/components/ui/skeleton";

/** A panel-shaped placeholder: header bar, then `rows` hairline-divided rows. */
function PanelSkeleton({ rows, rowHeight = "h-12" }: { rows: number; rowHeight?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
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
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The Brief's pending state (SPEC-119, shared in SPEC-230): the route's `loading.tsx`
 * and the client view render this same component, so the first paint is identical
 * whether the data is still streaming from the server or being fetched by the browser.
 * Real greeting instantly; then the shape of the page (SPEC-231) — the KPI strip and
 * the two columns of panels — so nothing jumps when the data lands.
 */
export function BriefSkeleton() {
  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <PanelSkeleton rows={3} rowHeight="h-24" />
          <PanelSkeleton rows={5} rowHeight="h-16" />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={2} />
          <PanelSkeleton rows={6} rowHeight="h-10" />
        </div>
      </div>
    </div>
  );
}
