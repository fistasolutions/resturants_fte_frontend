"use client";

import ReportsLoading from "@/app/(app)/reports/loading";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Card } from "@/components/ui/card";
import { GenerateReportButton } from "@/features/reports/generate-report-button";
import { ReportGenerationBoundary } from "@/features/reports/generation-context";
import { PeriodToggle } from "@/features/reports/period-toggle";
import { ReportV2View } from "@/features/reports/report-v2-view";
import { ReportViewer } from "@/features/reports/report-viewer";
import { ScopePicker } from "@/features/reports/scope-picker";
import { ScheduledReportsCard } from "@/features/reports/scheduled-reports-card";
import { ScopedReportView } from "@/features/reports/scoped-report-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { isNotFound } from "@/lib/api-error";
import { reportQueries } from "@/lib/queries/reports";
import { scopeLabel } from "@/lib/report-scope";
import type { ReportDetail, ReportPeriod } from "@/types/reports";

const PERIOD_NOTE: Record<Exclude<ReportPeriod, "daily">, string> = {
  weekly: "Weekly rollup — the last 7 days vs the prior 7 (live, always current).",
  monthly: "Monthly rollup — the last 30 days vs the prior 30 (live, always current).",
};

interface ReportsViewProps {
  scope: string;
  period: ReportPeriod;
  /** A valid `?date=` from the URL, or null for "the latest stored report". */
  requestedDate: string | null;
}

/**
 * Daily Reports, read from the client cache (SPEC-230).
 *
 * The list and scopes are prefetched by the page; the active report depends on the
 * list when no date is requested, so that query is built only once the list has
 * arrived (`null` definition → parked, no fetch). Weekly/Monthly is a live rollup
 * (D-08) and skips the stored-report fetch entirely, as before.
 */
export function ReportsView({ scope, period, requestedDate }: ReportsViewProps) {
  const list = useApiQuery(reportQueries.list(5));
  const scopes = useApiQuery(reportQueries.scopes());

  const activeDate = requestedDate ?? list.data?.items[0]?.report_date ?? null;
  const wantsStored = period === "daily" && activeDate !== null;

  const report = useApiQuery(
    wantsStored && activeDate ? reportQueries.detail(activeDate, scope) : null,
  );
  const rollup = useApiQuery(
    period !== "daily" ? reportQueries.rollup(period, requestedDate ?? undefined) : null,
  );

  if (list.isPending || scopes.isPending) return <ReportsLoading />;
  if (list.isError) return <QueryErrorState error={list.error} onRetry={() => void list.refetch()} />;
  if (scopes.isError) {
    return <QueryErrorState error={scopes.error} onRetry={() => void scopes.refetch()} />;
  }
  // The stored report and the rollup are the body of the page: wait for whichever
  // one this view asked for, the same way the server page did.
  if (wantsStored && report.isPending) return <ReportsLoading />;
  if (period !== "daily" && rollup.isPending) return <ReportsLoading />;
  if (period !== "daily" && rollup.isError) {
    return <QueryErrorState error={rollup.error} onRetry={() => void rollup.refetch()} />;
  }
  // A missing stored report is an empty state, not a failure (as before).
  if (wantsStored && report.isError && !isNotFound(report.error)) {
    return <QueryErrorState error={report.error} onRetry={() => void report.refetch()} />;
  }

  const notFound = wantsStored && report.isError;
  const storedReport = wantsStored && report.isSuccess ? report.data : null;
  const rollupReport: ReportDetail | null =
    period !== "daily" && rollup.isSuccess
      ? {
          report_date: rollup.data.date,
          scope: "all",
          content_md: "",
          metrics: rollup.data.metrics,
          generated_by: "fallback",
          created_at: new Date().toISOString(),
        }
      : null;

  const scopeName = scopeLabel(scope, scopes.data.locations);

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ScopePicker scopes={scopes.data} activeScope={scope} activeDate={activeDate} />
        {scope === "all" && <PeriodToggle active={period} />}
      </div>

      {/* SPEC-335: Report FTE schedules the owner chose to show here, by period. */}
      {scope === "all" && <ScheduledReportsCard cadence={period} />}

      <ReportGenerationBoundary>
      {rollupReport ? (
        <ReportV2View
          report={rollupReport}
          periodLabel={period}
          periodNote={period !== "daily" ? PERIOD_NOTE[period] : undefined}
        />
      ) : storedReport ? (
        scope === "all" ? (
          // SPEC-027 payloads get the v2 layout; older reports keep the
          // legacy viewer untouched (Rule 7 — history is not rewritten).
          storedReport.metrics.margin ? (
            <ReportV2View report={storedReport} />
          ) : (
            <div className="space-y-4">
              <Card className="flex-row flex-wrap items-center justify-between gap-3 border-dashed px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  This report predates the new layout — regenerate it to get
                  margins, per-store performance, and fulfillment panels.
                </p>
                <GenerateReportButton
                  date={storedReport.report_date}
                  scope="all"
                  variant="regenerate"
                />
              </Card>
              <ReportViewer report={storedReport} />
            </div>
          )
        ) : (
          <ScopedReportView report={storedReport} scopeName={scopeName} />
        )
      ) : (
        <Card className="gap-4 px-6 py-10">
          <p className="text-sm text-muted-foreground">
            {scope !== "all" && activeDate
              ? `No ${scopeName} report exists for ${activeDate} yet. Scoped views generate on demand — it takes a few seconds.`
              : notFound
                ? "No report exists for that date — pick a day from the history."
                : "No reports yet. The first executive report is generated automatically each morning and every following day is archived here."}
          </p>
          {scope !== "all" && activeDate && (
            <GenerateReportButton date={activeDate} scope={scope} />
          )}
        </Card>
      )}
      </ReportGenerationBoundary>
    </div>
  );
}
