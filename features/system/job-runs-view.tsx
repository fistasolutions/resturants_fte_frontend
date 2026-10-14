"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RunFilters } from "@/features/system/run-filters";
import { RunPager } from "@/features/system/run-pager";
import { RunTable } from "@/features/system/run-table";
import { useApiQuery } from "@/hooks/use-api-query";
import { systemQueries } from "@/lib/queries/system";
import { healthTone, relativeTime } from "@/lib/system-trace";

interface JobRunsViewProps {
  jobId: string;
  status: string | undefined;
  window: string;
  page: number;
}

/** One job's run history (SPEC-228), read from the client cache (SPEC-230). The
 * overview answer is the same one the System tab already holds. */
export function JobRunsView({ jobId, status, window, page }: JobRunsViewProps) {
  const overviewQ = useApiQuery(systemQueries.jobs());
  const runsQ = useApiQuery(systemQueries.runs({ jobId, status, window, page }));
  if (overviewQ.isPending || runsQ.isPending) {
    return (
      <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </main>
    );
  }
  if (overviewQ.isError) {
    return <QueryErrorState error={overviewQ.error} onRetry={() => void overviewQ.refetch()} />;
  }
  if (runsQ.isError) return <QueryErrorState error={runsQ.error} onRetry={() => void runsQ.refetch()} />;
  const overview = overviewQ.data;
  const runs = runsQ.data;

  const job = overview.jobs.find((candidate) => candidate.key === jobId);
  if (!job) notFound();

  const tone = healthTone(job.health);

  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/system" className="transition-colors hover:text-foreground">
          System
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">{job.title}</span>
      </nav>

      <PageHeader
        title={job.title}
        description={job.purpose}
        actions={
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.chip}`}
          >
            {tone.label}
          </span>
        }
      />

      <dl className="flex flex-wrap gap-x-8 gap-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Runs</dt>
          <dd className="mt-0.5 font-medium">{job.cadenceLabel}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Last success</dt>
          <dd className="mt-0.5 font-medium">{relativeTime(job.lastSuccessAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Recorded runs</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{runs.total}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Run history
        </h2>
        <RunFilters jobId={jobId} />
      </div>

      <RunTable
        page={runs}
        showJob={false}
        emptyHint={
          status || window !== "all"
            ? "Try widening the period, or clearing the outcome filter."
            : "This job has never reported a run."
        }
      />
      <RunPager
        page={runs}
        basePath={`/system/${jobId}`}
        params={{ status, window: window === "all" ? undefined : window }}
      />
    </main>
  );
}
