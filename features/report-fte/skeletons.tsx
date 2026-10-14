import { Skeleton } from "@/components/ui/skeleton";

/**
 * Content-only skeletons for the Report FTE tabs (SPEC-256). The header and the tab
 * bar live in the persistent shell and stay painted; each of these fills only the
 * content area with the shape of the page it stands in for, so nothing shifts when
 * the data arrives.
 */

function Tiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-[72px] rounded-xl" />
      ))}
    </div>
  );
}

/** The Desk's shape (SPEC-289): the prompt block, then the template grid. */
export function DeskSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 pt-6 md:pt-10">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="mt-2 h-36 w-full rounded-2xl" />
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-44 rounded-full" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <Skeleton className="mb-3 h-4 w-24" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ComposerSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
      <Skeleton className="h-[520px] rounded-2xl" />
      <Skeleton className="h-[520px] rounded-2xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}

export function TemplatesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function TemplateEditorSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-72" />
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export function DeliveredSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 border-b border-border pb-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-28" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div className="flex flex-col gap-4">
        <Tiles count={6} />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-2xl" />
    </div>
  );
}

export function ReportPageSkeleton() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-3 w-96" />
        </div>
        <Skeleton className="h-8 w-56 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[720px] rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </main>
  );
}
