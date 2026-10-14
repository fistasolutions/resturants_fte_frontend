import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the history layout — search, filter chips, and rows with icon,
 * two text lines, and a badge — so pagination/search transitions never
 * shift the page (SPEC-035). */
export default function ReportHistoryLoading() {
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-full max-w-md rounded-lg" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 md:px-6"
          >
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-56 max-w-full" />
              <Skeleton className="h-3 w-40 max-w-full" />
            </div>
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
