import { Skeleton } from "@/components/ui/skeleton";

/** Product-detail skeleton (SPEC-146) — gallery + identity/metrics + variants. */
export default function ProductDetailLoading() {
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <Skeleton className="h-4 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/5] w-full rounded-card" />
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-card" />
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-56 w-full rounded-card" />
    </main>
  );
}
