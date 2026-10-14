"use client";

import SystemLoading from "@/app/(app)/system/loading";
import RunsLoading from "@/app/(app)/system/runs/loading";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { HealthSummary } from "@/features/system/health-summary";
import { JobGrid } from "@/features/system/job-grid";
import { RunFilters } from "@/features/system/run-filters";
import { RunPager } from "@/features/system/run-pager";
import { RunTable } from "@/features/system/run-table";
import { useApiQuery } from "@/hooks/use-api-query";
import { systemQueries } from "@/lib/queries/system";

/** The System tabs (SPEC-228/229), read from the client cache (SPEC-230). Content
 * only — the header and tab bar live in the persistent shell. */

export function SystemOverviewTab() {
  const overview = useApiQuery(systemQueries.jobs());
  if (overview.isPending) return <SystemLoading />;
  if (overview.isError) return <QueryErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  return (
    <div className="space-y-6">
      <HealthSummary totals={overview.data.totals} />
      <JobGrid jobs={overview.data.jobs} />
    </div>
  );
}

interface AllRunsTabProps {
  status: string | undefined;
  window: string;
  page: number;
}

/** Every job's runs in one table — for "what failed last night". */
export function AllRunsTab({ status, window, page }: AllRunsTabProps) {
  const runs = useApiQuery(systemQueries.runs({ status, window, page }));
  if (runs.isPending) return <RunsLoading />;
  if (runs.isError) return <QueryErrorState error={runs.error} onRetry={() => void runs.refetch()} />;
  const data = runs.data;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          {data.total} {data.total === 1 ? "run" : "runs"} recorded
        </p>
        <RunFilters />
      </div>

      <RunTable
        page={data}
        emptyHint="Try widening the period, or clearing the outcome filter."
      />
      <RunPager
        page={data}
        basePath="/system/runs"
        params={{ status, window: window === "all" ? undefined : window }}
      />
    </div>
  );
}
