/**
 * Pure tab model + routing helpers for the Store Traffic page (SPEC-112).
 * Framework-free so it's unit-testable and shared by the persistent shell and
 * the tab bar. Mirrors `lib/product-tabs.ts`.
 */

import { resolveDateRange, type ResolvedRange } from "@/lib/date-range";
import { dateToISO } from "@/utils/date";

export type TrafficTabKey =
  | "overview"
  | "stores"
  | "opportunity"
  | "hours"
  | "staffing"
  | "website";

export interface TrafficTabDef {
  key: TrafficTabKey;
  label: string;
  basePath: string;
}

export const TRAFFIC_TABS: TrafficTabDef[] = [
  { key: "overview", label: "Overview", basePath: "/traffic" },
  { key: "stores", label: "Store League", basePath: "/traffic/stores" },
  { key: "opportunity", label: "Lost-Sales", basePath: "/traffic/opportunity" },
  { key: "hours", label: "Peak Hours", basePath: "/traffic/hours" },
  // SPEC-219: Peak Hours one step further on — which hour gives cover up and which
  // takes it, hour for hour. Sits next to the tab whose data it reads.
  { key: "staffing", label: "Staffing", basePath: "/traffic/staffing" },
  // SPEC-214: V-Count measures who walked into the shop; Clarity measures who walked
  // onto the site. Same page, same question, so it is a tab here rather than a new route.
  { key: "website", label: "Website", basePath: "/traffic/website" },
];

const TAB_BY_PATH = new Map(TRAFFIC_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/** The tab whose route is EXACTLY this pathname, or `null` on nested routes. */
export function activeTrafficTab(pathname: string): TrafficTabKey | null {
  return TAB_BY_PATH.get(normalizePath(pathname))?.key ?? null;
}

/** True on exactly the traffic tab routes. */
export function isTrafficTabRoute(pathname: string): boolean {
  return activeTrafficTab(pathname) !== null;
}

const CARRIED_RANGE_PARAMS = ["range", "from", "to", "period"] as const;

/** A tab link that preserves the active date range across the switch. */
export function trafficTabHref(basePath: string, current: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of CARRIED_RANGE_PARAMS) {
    const value = current.get(key);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Traffic defaults to a 7-day window (footfall is dense) unless the URL asks
 * for a specific range. Shared by the shell (picker) and each tab's fetch so the
 * label and the data always match. */
/**
 * Staffing needs a longer default than the rest of Store Traffic (SPEC-219).
 * A rota change is not defensible on fewer than four weeks of footfall, so a
 * seven-day default lands every user on "not enough data" and makes the tab look
 * broken. Ninety days gives a real plan on arrival, and the picker still shows
 * exactly the window the data was loaded for.
 */
export const STAFFING_DEFAULT_DAYS = 90;
const DEFAULT_DAYS = 7;

export function trafficDefaultDays(tab: TrafficTabKey | null): number {
  return tab === "staffing" ? STAFFING_DEFAULT_DAYS : DEFAULT_DAYS;
}

export function resolveTrafficRange(
  params: { range?: string; from?: string; to?: string },
  tab: TrafficTabKey | null = null,
): ResolvedRange {
  const now = new Date();
  const todayISO = dateToISO(now);
  const days = trafficDefaultDays(tab);
  const startISO = dateToISO(new Date(now.getTime() - days * 86_400_000));
  const hasExplicit = Boolean(params.range || params.from || params.to);
  return resolveDateRange(
    hasExplicit ? params : { from: startISO, to: todayISO },
    todayISO,
  );
}
