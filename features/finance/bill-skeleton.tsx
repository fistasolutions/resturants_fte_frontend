import { Skeleton } from "@/components/ui/skeleton";

/** A bill's own page carries its own header, so its skeleton does too (SPEC-299). */
export function BillSkeleton() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <Skeleton className="h-4 w-64 rounded-md" />
      <Skeleton className="h-9 w-80 rounded-md" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    </main>
  );
}
