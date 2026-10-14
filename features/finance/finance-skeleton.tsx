import { Skeleton } from "@/components/ui/skeleton";

/**
 * One skeleton per Finance Oversight tab (SPEC-301), each shaped like the tab it stands
 * in for — tiles where tiles will be, a grid where the grid will be — so the page never
 * jumps when the data lands. Content-only (SPEC-232): the header is the shell's.
 */

function Tiles({ count, className = "h-16" }: { count: number; className?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${className} rounded-xl`} />
      ))}
    </>
  );
}

function TableRows({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-0 overflow-hidden rounded-card border border-border bg-card">
      <Skeleton className="h-10 rounded-none" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-border px-3 py-2.5">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading the overview">
      <Skeleton className="h-9 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Tiles count={6} />
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Tiles count={3} className="h-28" />
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <Tiles count={3} className="h-64" />
      </div>
    </div>
  );
}

export function BillsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading bills">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <TableRows rows={10} />
    </div>
  );
}

export function RunSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading the payment run">
      <Skeleton className="h-7 w-72 rounded-[10px]" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tiles count={4} className="h-24" />
      </div>
      <TableRows rows={8} />
    </div>
  );
}

export function AgingSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading aging">
      <TableRows rows={4} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
      <TableRows rows={6} />
    </div>
  );
}

export function VendorsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading vendors">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tiles count={4} />
      </div>
      <TableRows rows={10} />
    </div>
  );
}

export function CashSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading cash">
      <Skeleton className="h-7 w-80 rounded-[10px]" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tiles count={4} />
      </div>
      <Skeleton className="h-72 rounded-card" />
      <TableRows rows={6} />
    </div>
  );
}

export function ValueSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading the value statement">
      <Skeleton className="h-14 rounded-xl" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        <Tiles count={5} />
      </div>
      <TableRows rows={6} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" aria-busy="true" aria-label="Loading the profile">
      <div className="space-y-3">
        <Skeleton className="h-48 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-60 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    </div>
  );
}

/** The route's own `loading.tsx` — the overview's shape, the most common landing. */
export function FinanceSkeleton() {
  return <OverviewSkeleton />;
}
