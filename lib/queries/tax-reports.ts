/** sales/tax report queries (SPEC-166; backend SPEC-171) — defined once for both
 * transports (SPEC-230). The backend computes and reconciles everything; the UI
 * only presents. Byte-identical paths to `services/tax-reports.ts`. */
import { defineQuery } from "@/lib/query-def";
import type { TaxReportDetail, TaxReportRows, TaxReportSummary } from "@/types/tax-report";

export const taxReportPaths = {
  list: (limit: number): string => `/tax-reports?limit=${limit}`,
  detail: (reportId: number): string => `/tax-reports/${reportId}`,
  rows: (reportId: number): string => `/tax-reports/${reportId}/rows`,
} as const;

export const taxReportQueries = {
  list: (limit = 24) =>
    defineQuery<TaxReportSummary[]>(["tax-reports", "list", limit], async (api) => {
      const { reports } = await api<{ reports: TaxReportSummary[] }>(taxReportPaths.list(limit));
      return reports;
    }),
  detail: (reportId: number) =>
    defineQuery<TaxReportDetail>(["tax-reports", "detail", reportId], (api) =>
      api<TaxReportDetail>(taxReportPaths.detail(reportId)),
    ),
  rows: (reportId: number) =>
    defineQuery<TaxReportRows>(["tax-reports", "rows", reportId], (api) =>
      api<TaxReportRows>(taxReportPaths.rows(reportId)),
    ),
} as const;
