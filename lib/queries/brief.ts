/**
 * Morning Brief queries (SPEC-230) — paths, cache keys and loaders, defined once.
 *
 * `services/brief.ts` (server) and the Brief view (client) both run these; the paths
 * below are byte-identical to the ones the service called before SPEC-230, so the
 * backend sees no change.
 */
import type { CompareMode } from "@/lib/date-range";
import { defineQuery } from "@/lib/query-def";
import type {
  BriefAttention,
  BriefData,
  BriefHistoryList,
  BriefRangeKpisResponse,
  OverdueSheetsResponse,
  TrafficNudgeSheetsResponse,
  TransferSheetsResponse,
  WinbackListResponse,
} from "@/types/brief";

export interface BriefRangeKpisQuery {
  from: string;
  to: string;
  compare: CompareMode;
}

export interface WinbackQuery {
  page?: number;
  limit?: number;
  q?: string;
  minSpend?: number | null;
  minSilent?: number | null;
}

export const briefPaths = {
  data: (query?: BriefRangeKpisQuery): string =>
    query
      ? `/brief?start=${query.from}&end=${query.to}&compare=${query.compare}`
      : "/brief",
  kpis: ({ from, to, compare }: BriefRangeKpisQuery): string =>
    `/brief/kpis?start=${from}&end=${to}&compare=${compare}`,
  byDate: (date: string): string => `/brief/${date}`,
  history: (page: number, limit: number): string =>
    `/brief/history?page=${page}&limit=${limit}`,
  attention: (): string => "/brief/attention",
  transfers: (): string => "/brief/transfers",
  overdue: (): string => "/brief/overdue",
  traffic: (): string => "/brief/traffic",
  winback: ({ page = 1, limit = 15, q = "", minSpend, minSilent }: WinbackQuery = {}): string => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    if (minSpend) params.set("min_spend", String(minSpend));
    if (minSilent) params.set("min_silent", String(minSilent));
    return `/brief/winback?${params.toString()}`;
  },
} as const;

export const briefQueries = {
  /** Today's live brief; `query` only anchors each decision's compare amount (SPEC-069). */
  data: (query?: BriefRangeKpisQuery) =>
    defineQuery<BriefData>(
      ["brief", "data", query ? { from: query.from, to: query.to, compare: query.compare } : null],
      (api) => api<BriefData>(briefPaths.data(query)),
    ),
  /** Range + compare KPIs (SPEC-067). */
  kpis: (query: BriefRangeKpisQuery) =>
    defineQuery<BriefRangeKpisResponse>(
      ["brief", "kpis", { from: query.from, to: query.to, compare: query.compare }],
      (api) => api<BriefRangeKpisResponse>(briefPaths.kpis(query)),
    ),
  /** A frozen, archived brief (read-only). */
  byDate: (date: string) =>
    defineQuery<BriefData>(["brief", "by-date", date], (api) =>
      api<BriefData>(briefPaths.byDate(date)),
    ),
  history: (page = 1, limit = 10) =>
    defineQuery<BriefHistoryList>(["brief", "history", page, limit], (api) =>
      api<BriefHistoryList>(briefPaths.history(page, limit)),
    ),
  /** "Needs Attention" — always live, never archived (SPEC-104). */
  attention: () =>
    defineQuery<BriefAttention>(["brief", "attention"], (api) =>
      api<BriefAttention>(briefPaths.attention()),
    ),
  transfers: () =>
    defineQuery<TransferSheetsResponse>(["brief", "transfers"], (api) =>
      api<TransferSheetsResponse>(briefPaths.transfers()),
    ),
  overdue: () =>
    defineQuery<OverdueSheetsResponse>(["brief", "overdue"], (api) =>
      api<OverdueSheetsResponse>(briefPaths.overdue()),
    ),
  traffic: () =>
    defineQuery<TrafficNudgeSheetsResponse>(["brief", "traffic"], (api) =>
      api<TrafficNudgeSheetsResponse>(briefPaths.traffic()),
    ),
  winback: (query: WinbackQuery = {}) =>
    defineQuery<WinbackListResponse>(
      [
        "brief",
        "winback",
        {
          page: query.page ?? 1,
          limit: query.limit ?? 15,
          q: query.q ?? "",
          minSpend: query.minSpend ?? null,
          minSilent: query.minSilent ?? null,
        },
      ],
      (api) => api<WinbackListResponse>(briefPaths.winback(query)),
    ),
} as const;
