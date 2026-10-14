/** sales/tax reports (SPEC-166; backend SPEC-171) — server transport. Since
 * SPEC-230 the paths, keys and loaders live in `lib/queries/tax-reports.ts`; this
 * module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { taxReportQueries } from "@/lib/queries/tax-reports";
import type { TaxReportDetail, TaxReportRows, TaxReportSummary } from "@/types/tax-report";

export async function getTaxReports(limit = 24): Promise<TaxReportSummary[]> {
  return taxReportQueries.list(limit).load(serverApi);
}

export function getTaxReport(reportId: number): Promise<TaxReportDetail> {
  return taxReportQueries.detail(reportId).load(serverApi);
}

export function getTaxReportRows(reportId: number): Promise<TaxReportRows> {
  return taxReportQueries.rows(reportId).load(serverApi);
}
