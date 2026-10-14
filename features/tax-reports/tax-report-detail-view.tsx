"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { DeleteReportButton } from "@/features/tax-reports/delete-report-button";
import { ReportView } from "@/features/tax-reports/report-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { isNotFound } from "@/lib/api-error";
import { taxReportQueries } from "@/lib/queries/tax-reports";

/** One tax report, read from the client cache (SPEC-230); a 404 is the route's
 * not-found page, as before. */
export function TaxReportDetailView({ reportId }: { reportId: number }) {
  const reportQ = useApiQuery(taxReportQueries.detail(reportId));
  const rowsQ = useApiQuery(taxReportQueries.rows(reportId));
  if (reportQ.isPending || rowsQ.isPending) return <PageSkeleton blocks={3} />;
  if (reportQ.isError) {
    if (isNotFound(reportQ.error)) notFound();
    return <QueryErrorState error={reportQ.error} onRetry={() => void reportQ.refetch()} />;
  }
  if (rowsQ.isError) {
    if (isNotFound(rowsQ.error)) notFound();
    return <QueryErrorState error={rowsQ.error} onRetry={() => void rowsQ.refetch()} />;
  }
  const report = reportQ.data;
  const rows = rowsQ.data;

  return (
    <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/tax-reports" className="transition-colors hover:text-foreground">
          Sales &amp; Tax Reports
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">
          {report.period_label}
        </span>
      </nav>

      {/* Same component the landing page opens the newest report with, so the
          two views can never drift apart. */}
      <ReportView
        report={report}
        rows={rows}
        heading={
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl tracking-tight">{report.period_label}</h1>
            <DeleteReportButton reportId={report.id} periodLabel={report.period_label} />
          </div>
        }
      />
    </main>
  );
}
