import { FileSpreadsheet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { StatusBadge } from "@/features/tax-reports/status-badge";
import {
  CURRENCY_COLUMNS,
  TAX_REPORT_COLUMNS,
  formatDifference,
  formatRate,
} from "@/lib/tax-report";
import type { TaxReportDetail, TaxReportRow, TaxReportRows } from "@/types/tax-report";
import { formatCurrency, formatNumber } from "@/utils/format";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="relative gap-1 p-4">
      <span className="pr-6 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <ExplainButton target={{ metric: label, value }} />
      <span className="font-heading text-xl tracking-tight tabular-nums">{value}</span>
    </Card>
  );
}

function cellValue(row: TaxReportRow, column: (typeof TAX_REPORT_COLUMNS)[number]) {
  const value = row[column];
  if (column === "Total Tax Rate (%)") return formatRate(Number(value));
  if (CURRENCY_COLUMNS.has(column)) return formatCurrency(Number(value));
  return String(value ?? "");
}

const isNumericColumn = (column: (typeof TAX_REPORT_COLUMNS)[number]) =>
  CURRENCY_COLUMNS.has(column) || column === "Total Tax Rate (%)";

/**
 * One report, open — status, totals, discrepancies, the ten columns and the
 * assumptions behind them.
 *
 * Shared by the landing page (which opens the newest report immediately) and
 * the per-report page, so the two can never drift. The client's own description
 * of the end state is "open dashboard → confirm RECONCILED → download", which
 * only works if the report is already open when he arrives.
 */
export function ReportView({
  report,
  rows,
  heading,
}: {
  report: TaxReportDetail;
  rows: TaxReportRows;
  heading?: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {heading ?? (
              <h2 className="font-heading text-xl tracking-tight">{report.period_label}</h2>
            )}
            <StatusBadge reconciled={report.reconciled} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Generated {new Date(report.generated_at).toLocaleString()} ·{" "}
            {formatNumber(report.row_count)} rows · {report.file_name}
          </p>
        </div>
        <a
          href={`/api/proxy/tax-reports/${report.id}/download`}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FileSpreadsheet className="size-4" aria-hidden />
          Download Excel
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Total Sales" value={formatCurrency(report.total_sales)} />
        <Tile label="Taxable Sales" value={formatCurrency(report.taxable_sales)} />
        <Tile label="Non-Taxable Sales" value={formatCurrency(report.non_taxable_sales)} />
        <Tile label="Total Tax" value={formatCurrency(report.total_tax)} />
      </div>

      {/* REVIEW REQUIRED never appears without its cause — the client asked to
          see why, not just that. */}
      {!report.reconciled && report.issues.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Review required</h3>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="px-4 py-2.5 font-medium">Area</th>
                    <th className="px-4 py-2.5 text-right font-medium">Expected</th>
                    <th className="px-4 py-2.5 text-right font-medium">Calculated</th>
                    <th className="px-4 py-2.5 text-right font-medium">Difference</th>
                    <th className="px-4 py-2.5 font-medium">Cause</th>
                  </tr>
                </thead>
                <tbody>
                  {report.issues.map((issue, index) => (
                    <tr
                      key={`${issue.area}-${index}`}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-2.5 font-medium">{issue.area}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {formatDifference(issue.expected)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {formatDifference(issue.calculated)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums text-destructive">
                        {formatDifference(issue.difference)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{issue.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold">Report rows</h3>
        <Card className="overflow-hidden p-0">
          {/* Own scroll container so the page itself never scrolls sideways. */}
          <div className="max-h-[32rem] overflow-auto">
            <table className="w-full min-w-[64rem] text-sm">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted">
                <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                  {TAX_REPORT_COLUMNS.map((column) => (
                    <th
                      key={column}
                      className={`px-3 py-2.5 font-medium whitespace-nowrap ${
                        isNumericColumn(column) ? "text-right" : ""
                      }`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.rows.map((row, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    {TAX_REPORT_COLUMNS.map((column) => (
                      <td
                        key={column}
                        className={`px-3 py-2 whitespace-nowrap ${
                          isNumericColumn(column) ? "text-right tabular-nums" : ""
                        }`}
                      >
                        {cellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

    </div>
  );
}
