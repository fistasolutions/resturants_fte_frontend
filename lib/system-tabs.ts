/**
 * Pure tab model + routing helpers for the System section (SPEC-229).
 *
 * Framework-free so it is unit-testable and shared by the persistent shell and the tab
 * bar. Mirrors `lib/traffic-tabs.ts`, which is the pattern fourteen other sections of
 * the app already use.
 */

export type SystemTabKey = "overview" | "runs";

export interface SystemTabDef {
  key: SystemTabKey;
  label: string;
  basePath: string;
}

export const SYSTEM_TABS: SystemTabDef[] = [
  { key: "overview", label: "Overview", basePath: "/system" },
  // Every job's runs in one table — "what failed last night", rather than
  // "how is this one job", which is what /system/[jobId] answers.
  { key: "runs", label: "All runs", basePath: "/system/runs" },
];

const TAB_BY_PATH = new Map(SYSTEM_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * The tab whose route is EXACTLY this pathname, or `null` on a nested route.
 *
 * `null` is what keeps the shell off `/system/[jobId]`: that page carries its own
 * breadcrumb and job title, and a section header above it would be two headers
 * arguing about what the page is called.
 */
export function activeSystemTab(pathname: string): SystemTabKey | null {
  return TAB_BY_PATH.get(normalizePath(pathname))?.key ?? null;
}

/** Filters the shell must carry across a tab switch, so one cannot be lost. */
const CARRIED_PARAMS = ["status", "window"] as const;

export function systemTabHref(
  basePath: string,
  current: URLSearchParams | null,
): string {
  const params = new URLSearchParams();
  for (const key of CARRIED_PARAMS) {
    const value = current?.get(key);
    if (value) params.set(key, value);
  }
  // `page` is deliberately NOT carried: page 4 of one view is meaningless in
  // another, and landing on an empty page with no explanation is worse than
  // starting at the top.
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
