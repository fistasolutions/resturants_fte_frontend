"use client";


import { PageSkeleton } from "@/components/shared/page-skeleton";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Card } from "@/components/ui/card";
import { DeleteReportButton } from "@/features/tax-reports/delete-report-button";
import { GenerateForm } from "@/features/tax-reports/generate-form";
import { HistoryPanel } from "@/features/tax-reports/history-panel";
import { ReportView } from "@/features/tax-reports/report-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { taxReportQueries } from "@/lib/queries/tax-reports";
import { sortReportsNewestFirst } from "@/lib/tax-report";

/**
 * Sales & Tax Reports (SPEC-166), read from the client cache (SPEC-230). The newest
 * report opens immediately — the client's end state is "open dashboard → confirm
 * RECONCILED → download" — so its detail + rows depend on the list and are fetched
 * as soon as the list names it (prefetched by the page when it already knows).
 */
export function TaxReportsView() {
  const list = useApiQuery(taxReportQueries.list());
  const reports = list.data ? sortReportsNewestFirst(list.data) : [];
  const [latest, ...previous] = reports;
  const detailQ = useApiQuery(latest ? taxReportQueries.detail(latest.id) : null);
  const rowsQ = useApiQuery(latest ? taxReportQueries.rows(latest.id) : null);

  if (list.isPending || (latest && (detailQ.isPending || rowsQ.isPending))) {
    return <PageSkeleton blocks={3} />;
  }
  if (list.isError) return <QueryErrorState error={list.error} onRetry={() => void list.refetch()} />;
  if (detailQ.isError) return <QueryErrorState error={detailQ.error} onRetry={() => void detailQ.refetch()} />;
  if (rowsQ.isError) return <QueryErrorState error={rowsQ.error} onRetry={() => void rowsQ.refetch()} />;

  const detail = detailQ.data ?? null;
  const rows = rowsQ.data ?? null;

  return (
    // SPEC-232: header and the Nexus Watch link live in the layout shell now.
    <div className="space-y-6">
      <GenerateForm />

      {detail && rows ? (
        <ReportView
          report={detail}
          rows={rows}
          heading={
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl tracking-tight">{detail.period_label}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Latest
              </span>
              <DeleteReportButton
                reportId={detail.id}
                periodLabel={detail.period_label}
              />
            </div>
          }
        />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">No reports generated yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a period above and generate one, or wait for the automatic run on the
            23rd of the month.
          </p>
        </Card>
      )}

      <HistoryPanel reports={previous} />
    </div>
  );
}
