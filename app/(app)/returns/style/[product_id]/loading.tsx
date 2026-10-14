import { Skeleton } from "@/components/ui/skeleton";

/** Style-detail route skeleton (SPEC-095) — paints the detail page shape (back
 * link, header, KPI row, breakdown cards) instantly while its data streams in. */
export default function StyleDetailLoading() {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24 rounded-[10px]" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </main>
  );
}
