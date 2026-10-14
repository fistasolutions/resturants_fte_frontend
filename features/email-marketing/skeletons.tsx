import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeletons, one per shape a tab draws (SPEC-345). */

export function StripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] rounded-xl" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-2xl" />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-9 w-72 rounded-lg" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TabSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <StripSkeleton />
      <ListSkeleton rows={4} />
    </div>
  );
}
