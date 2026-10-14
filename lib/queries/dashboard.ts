/**
 * Dashboard queries (SPEC-230) — the composition that used to live in
 * `services/dashboard.ts` (SPEC-017/SPEC-037), now defined once so the Server
 * Component prefetch and the client refetch build the same view model from the same
 * paths. The backend sees exactly the calls it saw before.
 */
import {
  adaptAlerts,
  adaptChannels,
  adaptDashboardKpis,
  adaptNetSales,
  adaptRecentOrder,
  adaptReturnsSpikeTop,
  adaptRevenueSeries,
  adaptTopProducts,
  adaptWhatChanged,
  type ApiDashboard,
  type ApiWhatChanged,
  type RawReturnsSpikeItem,
} from "@/lib/adapters";
import {
  COMPARE_MODES,
  compareRangeFor,
  formatRangeLabel,
  type CompareMode,
} from "@/lib/date-range";
import { adaptCalendarNote, windowDates, type ApiCompareMeta } from "@/lib/calendar-note";
import { defineQuery, type ApiGet } from "@/lib/query-def";
import type { ReturnsSpikeItem } from "@/types/analytics";
import type {
  DashboardData,
  DashboardMoney,
  LocationKpisData,
  WhatChanged,
} from "@/types/dashboard";

export interface DashboardQuery {
  /** ISO range, inclusive — already resolved/clamped by `resolveDateRange`. */
  from: string;
  to: string;
  compare: CompareMode;
  /** Overrides the "Jun 1 – Jul 1, 2026" label with the preset name. */
  label?: string;
}

export const dashboardPaths = {
  data: ({ from, to, compare }: DashboardQuery): string =>
    `/dashboard?start=${from}&end=${to}&compare=${compare}`,
  whatChanged: ({ from, to }: Pick<DashboardQuery, "from" | "to">): string =>
    `/analysis/what-changed?start=${from}&end=${to}`,
  locations: (from: string, to: string): string =>
    `/dashboard/locations?start=${from}&end=${to}`,
  returnsSpikeTop: (limit: number): string => `/dashboard/returns-spike-top?limit=${limit}`,
  money: (): string => "/dashboard/money",
} as const;

/**
 * Top styles by return rate for the returns-spike subpage (SPEC-070, backend
 * SPEC-054) — null on failure so the page can show a retry card.
 */
export async function loadReturnsSpikeTop(
  api: ApiGet,
  limit: number,
): Promise<ReturnsSpikeItem[] | null> {
  try {
    const body = await api<{ items: RawReturnsSpikeItem[] }>(dashboardPaths.returnsSpikeTop(limit));
    return adaptReturnsSpikeTop(body.items);
  } catch (err) {
    console.error("[loadReturnsSpikeTop] failed:", err);
    return null;
  }
}

/**
 * KPI delta suffix, e.g. "vs Jun 13 – Jun 19" or "vs Jul 20, 2025 (same time)". The
 * window the backend actually compared wins (SPEC-307) — the only source for the Hebrew
 * calendar, and never at odds with the numbers; the local mirror covers older backends.
 */
export function comparisonLabel(
  query: DashboardQuery,
  todayISO: string,
  compared?: ApiCompareMeta | null,
): string | null {
  if (COMPARE_MODES[query.compare].shortLabel === null) return null;
  const range = compared ? windowDates(compared) : compareRangeFor(query.from, query.to, query.compare);
  if (!range) return query.compare === "hebrew_year" ? COMPARE_MODES.hebrew_year.shortLabel : null;
  const intradayToday = query.from === query.to && query.to === todayISO;
  const suffix =
    intradayToday && query.compare === "previous_period" ? " (same time)" : "";
  return `vs ${formatRangeLabel(range.from, range.to)}${suffix}`;
}

/**
 * What changed, and why (backend SPEC-214 / frontend SPEC-190). Resolves null on
 * failure so the dashboard degrades to its previous shape rather than erroring — this
 * is a supporting card, not the page.
 */
export async function loadWhatChanged(
  api: ApiGet,
  query: Pick<DashboardQuery, "from" | "to">,
): Promise<WhatChanged | null> {
  try {
    const raw = await api<ApiWhatChanged>(dashboardPaths.whatChanged(query));
    return adaptWhatChanged(raw);
  } catch (err) {
    console.error("[loadWhatChanged] failed:", err);
    return null;
  }
}

export async function loadDashboardData(
  api: ApiGet,
  query: DashboardQuery,
): Promise<DashboardData> {
  const todayISO = new Date().toISOString().slice(0, 10);

  // Parallel, never waterfalled (root Rule 5).
  const [dashboard, whatChanged] = await Promise.all([
    api<ApiDashboard>(dashboardPaths.data(query)),
    loadWhatChanged(api, query),
  ]);

  return {
    periodDate: query.to,
    periodLabel: query.label ?? formatRangeLabel(query.from, query.to),
    comparisonShortLabel: comparisonLabel(query, todayISO, dashboard.period.compare),
    showComparison: query.compare !== "none",
    calendarNote: query.compare === "none" ? null : adaptCalendarNote(dashboard.period.compare),
    kpis: adaptDashboardKpis(dashboard.kpis),
    netSales: adaptNetSales(dashboard.kpis),
    whatChanged,
    revenueSeries: adaptRevenueSeries(
      dashboard.revenue_series,
      dashboard.revenue_series_previous,
    ),
    topProducts: adaptTopProducts(dashboard.top_products),
    alerts: adaptAlerts(dashboard),
    recentOrders: dashboard.recent_orders.map(adaptRecentOrder),
    channels: adaptChannels(dashboard.channels),
  };
}

export const dashboardQueries = {
  /** The aggregate + "what changed", adapted. The label is part of the answer, so of the key. */
  data: (query: DashboardQuery) =>
    defineQuery<DashboardData>(
      [
        "dashboard",
        "data",
        { from: query.from, to: query.to, compare: query.compare, label: query.label ?? null },
      ],
      (api) => loadDashboardData(api, query),
    ),
  locations: (from: string, to: string) =>
    defineQuery<LocationKpisData>(["dashboard", "locations", { from, to }], (api) =>
      api<LocationKpisData>(dashboardPaths.locations(from, to)),
    ),
  returnsSpikeTop: (limit = 25) =>
    defineQuery<ReturnsSpikeItem[] | null>(["dashboard", "returns-spike-top", limit], (api) =>
      loadReturnsSpikeTop(api, limit),
    ),
  /** Money at stake (SPEC-237) — fixed windows, independent of the date picker; fetched
   * on its own so it never blocks the Dashboard. */
  money: () =>
    defineQuery<DashboardMoney>(["dashboard", "money"], (api) =>
      api<DashboardMoney>(dashboardPaths.money()),
    ),
} as const;
