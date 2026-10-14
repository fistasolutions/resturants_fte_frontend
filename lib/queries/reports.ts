/**
 * Daily-report queries (SPEC-230) — paths, keys and loaders for the stored per-date
 * executive reports (backend SPEC-009/016/033/035/106), defined once for both
 * transports. Byte-identical paths to the pre-SPEC-230 `services/reports.ts`.
 */
import { defineQuery } from "@/lib/query-def";
import type {
  ReportDetail,
  ReportHistory,
  ReportList,
  ReportPeriod,
  ReportRollup,
  ReportScopes,
} from "@/types/reports";

export interface ReportHistoryQuery {
  q: string | null;
  type: string | null;
  scope: string | null;
  limit: number;
  offset: number;
}

export const reportPaths = {
  list: (limit: number): string => `/reports?limit=${limit}`,
  detail: (date: string, scope: string): string =>
    `/reports/${date}${scope === "all" ? "" : `?scope=${encodeURIComponent(scope)}`}`,
  rollup: (period: ReportPeriod, date?: string): string =>
    `/reports/rollup?period=${period}${date ? `&date=${date}` : ""}`,
  scopes: (): string => "/reports/scopes",
  history: ({ q, type, scope, limit, offset }: ReportHistoryQuery): string => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (q) params.set("q", q);
    if (scope) params.set("scope", scope);
    else if (type) params.set("type", type);
    return `/reports/history?${params}`;
  },
} as const;

export const reportQueries = {
  list: (limit = 60) =>
    defineQuery<ReportList>(["reports", "list", limit], (api) =>
      api<ReportList>(reportPaths.list(limit)),
    ),
  detail: (date: string, scope = "all") =>
    defineQuery<ReportDetail>(["reports", "detail", date, scope], (api) =>
      api<ReportDetail>(reportPaths.detail(date, scope)),
    ),
  /** D-08 live rollup (backend SPEC-106): computed on the fly, never stored. */
  rollup: (period: ReportPeriod, date?: string) =>
    defineQuery<ReportRollup>(["reports", "rollup", period, date ?? null], (api) =>
      api<ReportRollup>(reportPaths.rollup(period, date)),
    ),
  /** The brand/location tab lists (SPEC-033) — never hardcoded in the UI. */
  scopes: () =>
    defineQuery<ReportScopes>(["reports", "scopes"], (api) =>
      api<ReportScopes>(reportPaths.scopes()),
    ),
  history: (query: ReportHistoryQuery) =>
    defineQuery<ReportHistory>(["reports", "history", { ...query }], (api) =>
      api<ReportHistory>(reportPaths.history(query)),
    ),
} as const;
