import { LoaderCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The composer while the FTE plans (SPEC-286): the three columns as the report will
 * be — plan blocks, a report page with a headline strip, a table and narrative lines,
 * the trace — with an honest status line. It is a skeleton of the shape, never fake
 * progress.
 */
export function PlanningSkeleton({ ask }: { ask: string | null }) {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-ai/40 bg-ai/5 px-3 py-1 text-xs font-medium text-ai">
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          Reading your ask and choosing the report&apos;s shape…
        </span>
        {ask ? <p className="min-w-0 truncate text-xs text-muted-foreground">“{ask}”</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
        <Card className="gap-3 p-4">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-lg border border-border px-2.5 py-2">
              <Skeleton className="mb-1.5 h-3 w-16" />
              <Skeleton className="h-2.5 w-36" />
            </div>
          ))}
          <Skeleton className="mt-1 h-2.5 w-40" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="rounded-lg border border-border px-2.5 py-2">
              <Skeleton className="mb-1.5 h-3 w-32" />
              <Skeleton className="mb-1 h-2.5 w-44" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
          <Skeleton className="h-9 w-full rounded-lg" />
        </Card>
        <Card className="gap-6 p-5">
          <div className="border-b border-border pb-4">
            <Skeleton className="mb-2 h-2.5 w-48" />
            <Skeleton className="mb-2 h-5 w-64" />
            <Skeleton className="h-2.5 w-56" />
          </div>
          <div>
            <Skeleton className="mb-3 h-2.5 w-28" />
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="rounded-xl border border-border px-3 py-2">
                  <Skeleton className="mb-2 h-2.5 w-16" />
                  <Skeleton className="mb-1.5 h-5 w-20" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="mb-3 h-2.5 w-20" />
            <div className="overflow-hidden rounded-xl border border-border">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex gap-3 border-t border-border px-3 py-3 first:border-t-0">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="ml-auto h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="gap-2 p-4">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="rounded-lg border border-border px-2.5 py-1.5">
                <Skeleton className="mb-1 h-3 w-36" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            ))}
          </Card>
          <Card className="gap-2 p-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </Card>
        </div>
      </div>
    </div>
  );
}
