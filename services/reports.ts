/** Daily reports service — server transport (SPEC-022) for the stored per-date
 * executive reports (backend SPEC-009/016). Since SPEC-230 the paths, keys and
 * loaders live in `lib/queries/reports.ts` so the client cache refetches the same
 * definitions through `/api/proxy`; this module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { reportQueries } from "@/lib/queries/reports";
import type {
  ReportDetail,
  ReportHistory,
  ReportList,
  ReportPeriod,
  ReportRollup,
  ReportScopes,
} from "@/types/reports";

export async function listReports(limit = 60): Promise<ReportList> {
  return reportQueries.list(limit).load(serverApi);
}

export async function getReport(date: string, scope = "all"): Promise<ReportDetail> {
  return reportQueries.detail(date, scope).load(serverApi);
}

/** D-08 live rollup (backend SPEC-106): Weekly/Monthly totals computed on the
 * fly (never stored). `date` is the anchor day the trailing window ends on. */
export async function getReportRollup(
  period: ReportPeriod,
  date?: string,
): Promise<ReportRollup> {
  return reportQueries.rollup(period, date).load(serverApi);
}

/** The brand/location tab lists (SPEC-033) — never hardcoded in the UI. */
export async function getReportScopes(): Promise<ReportScopes> {
  return reportQueries.scopes().load(serverApi);
}

/** The paginated archive — server-side search + pagination (SPEC-035). */
export async function getReportHistory(
  q: string | null,
  type: string | null,
  scope: string | null,
  limit = 10,
  offset = 0,
): Promise<ReportHistory> {
  return reportQueries.history({ q, type, scope, limit, offset }).load(serverApi);
}
