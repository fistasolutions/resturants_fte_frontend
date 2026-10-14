import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { DeleteReportButton } from "@/features/tax-reports/delete-report-button";
import { StatusBadge } from "@/features/tax-reports/status-badge";
import type { TaxReportSummary } from "@/types/tax-report";
import { formatCurrency, formatNumber } from "@/utils/format";

/**
 * Previously generated reports.
 *
 * Secondary to the open report above it — the client asked to be able to
 * "go back and retrieve prior reports easily without rerunning them", which is
 * a lookup, not the main task.
 */
export function HistoryPanel({ reports }: { reports: TaxReportSummary[] }) {
  if (reports.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">
        Previous reports{" "}
        <span className="font-normal text-muted-foreground">({reports.length})</span>
      </h2>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-2.5 font-medium">Period</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Total Sales</th>
                <th className="px-4 py-2.5 text-right font-medium">Total Tax</th>
                <th className="px-4 py-2.5 text-right font-medium">Rows</th>
                <th className="px-4 py-2.5 font-medium">Generated</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/tax-reports/${report.id}`}
                      className="font-medium transition-colors hover:text-primary"
                    >
                      {report.period_label}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge reconciled={report.reconciled} />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatCurrency(report.total_sales)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatCurrency(report.total_tax)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatNumber(report.row_count)}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(report.generated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/api/proxy/tax-reports/${report.id}/download`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent"
                      >
                        <FileSpreadsheet className="size-3.5" aria-hidden />
                        Excel
                      </a>
                      <DeleteReportButton
                        reportId={report.id}
                        periodLabel={report.period_label}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
