"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { StaffingView } from "@/features/traffic/staffing-view";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { planningQueries } from "@/lib/queries/planning";

/** Staffing tab (SPEC-219), read from the client cache (SPEC-230). The loader
 * resolves null on failure, which `StaffingView` renders as its empty state. */
export function StaffingTab({ range }: { range: ResolvedRange }) {
  const plan = useApiQuery(planningQueries.staffing(range.from, range.to));
  if (plan.isPending) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </>
    );
  }
  return <StaffingView data={plan.data ?? null} />;
}
