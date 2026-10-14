/**
 * Pure tab model + routing helpers for the Foresight page (SPEC-152 / V4).
 * Framework-free so it's unit-testable and shared by the persistent shell and the
 * tab bar. Mirrors `lib/traffic-tabs.ts`. Tabs are added as each is built:
 * Profit Lens → Store League → Forecast & Pace → Size Intelligence.
 */

import { resolveDateRange, type ResolvedRange } from "@/lib/date-range";
import { dateToISO } from "@/utils/date";

export type ForesightTabKey =
  | "profit"
  | "season"
  | "forecast"
  | "sizes"
  | "stockout"
  | "launch";
// (all four tabs are now built)

export interface ForesightTabDef {
  key: ForesightTabKey;
  label: string;
  basePath: string;
}

export const FORESIGHT_TABS: ForesightTabDef[] = [
  { key: "profit", label: "Profit Lens", basePath: "/foresight" },
  // SPEC-170: replaces the Store Health composite, which re-presented six
  // metrics that each already have their own tab. This is the one thing the
  // platform could not see: the Jewish calendar that drives the store's demand.
  { key: "season", label: "Season Radar", basePath: "/foresight/season" },
  { key: "forecast", label: "Forecast & Pace", basePath: "/foresight/forecast" },
  { key: "sizes", label: "Size Intelligence", basePath: "/foresight/sizes" },
  // Forward-looking and genuinely unknown: which variants run out where, when,
  // and what it costs. Distinct from "Size Intelligence" above, which reports
  // return quality on what already sold.
  { key: "stockout", label: "Stockout Risk", basePath: "/foresight/stockout" },
  // SPEC-192: the reorder lead time is six weeks, so a winner spotted at day 60
  // is a winner missed. Tracks each new drop against what a style that turned
  // out to be a winner had sold by the same age.
  { key: "launch", label: "Launch Watch", basePath: "/foresight/launch" },
];

const TAB_BY_PATH = new Map(FORESIGHT_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/** The tab whose route is EXACTLY this pathname, or `null` on nested routes. */
export function activeForesightTab(pathname: string): ForesightTabKey | null {
  return TAB_BY_PATH.get(normalizePath(pathname))?.key ?? null;
}

export function isForesightTabRoute(pathname: string): boolean {
  return activeForesightTab(pathname) !== null;
}

const CARRIED_RANGE_PARAMS = ["range", "from", "to", "period"] as const;

/** A tab link that preserves the active date range across the switch. */
export function foresightTabHref(basePath: string, current: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of CARRIED_RANGE_PARAMS) {
    const value = current.get(key);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Foresight defaults to 30 days (profit/margin is a period metric) unless the URL
 * asks for a range. Shared by the shell (picker) and each tab's fetch. */
export function resolveForesightRange(params: {
  range?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
  const now = new Date();
  const todayISO = dateToISO(now);
  const monthAgoISO = dateToISO(new Date(now.getTime() - 30 * 86_400_000));
  const hasExplicit = Boolean(params.range || params.from || params.to);
  return resolveDateRange(
    hasExplicit ? params : { from: monthAgoISO, to: todayISO },
    todayISO,
  );
}
