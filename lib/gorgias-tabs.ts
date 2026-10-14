/**
 * Pure tab model + routing for the Gorgias workspace (SPEC-094), mirroring the
 * Orders tab model (SPEC-087). Framework-free so it's unit-testable and shared
 * by the persistent shell and the tab bar.
 */

export type GorgiasTab = "overview" | "conversations" | "agents" | "alerts" | "voice";

export interface GorgiasTabDef {
  key: GorgiasTab;
  label: string;
  basePath: string;
}

export const GORGIAS_TABS: GorgiasTabDef[] = [
  { key: "overview", label: "Overview", basePath: "/team-performance" },
  { key: "conversations", label: "Conversations", basePath: "/team-performance/conversations" },
  { key: "agents", label: "Agents", basePath: "/team-performance/agents" },
  { key: "alerts", label: "Alerts", basePath: "/team-performance/alerts" },
  { key: "voice", label: "Voice of Customer", basePath: "/team-performance/voice-of-customer" },
];

/** Date-range params the workspace picker owns — carried across tab switches so
 * the selected range survives (conversation-only filters are NOT carried). */
export const RANGE_PARAM_KEYS = ["range", "from", "to"] as const;

const TAB_BY_PATH = new Map(GORGIAS_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * The tab whose route is EXACTLY this pathname, or `null` on any detail route
 * (`/team-performance/conversations/123`, `/team-performance/agents/5`). Exact
 * match — never a prefix — so the persistent shell renders only on the four tab
 * pages; detail pages render bare with their own breadcrumb.
 */
export function activeGorgiasTab(pathname: string): GorgiasTab | null {
  return TAB_BY_PATH.get(normalizePath(pathname))?.key ?? null;
}

export function isGorgiasTabRoute(pathname: string): boolean {
  return activeGorgiasTab(pathname) !== null;
}

/** The workspace defaults to the last 30 days, not "today" (SPEC-094 Patch):
 * support metrics over a single day are sparse (near-zero CSAT responses /
 * refunds), which made the Overview + columns look empty on landing. Inject a
 * 30-day preset when the URL carries no explicit range. */
export function withWorkspaceDefaultRange(
  params: Record<string, string | undefined>,
): Record<string, string | undefined> {
  if (params.range || (params.from && params.to) || params.date) {
    return params;
  }
  return { ...params, range: "30d" };
}

/** Guards a detail page's `returnTo` param (SPEC-094, SPEC-080 convention):
 * must be exactly a workspace tab route, optionally with a query string.
 * Never trust an arbitrary redirect target — a plain startsWith check would
 * also pass `/team-performance.evil.example`. */
export function isSafeGorgiasReturnPath(path: string): boolean {
  return /^\/team-performance(\/(conversations|agents|alerts)(\/\d+)?)?(\?[^\s]*)?$/.test(path);
}

/** A tab's href with only the date-range params carried forward. */
export function gorgiasTabHref(basePath: string, params: URLSearchParams): string {
  const carried = new URLSearchParams();
  for (const key of RANGE_PARAM_KEYS) {
    const value = params.get(key);
    if (value) carried.set(key, value);
  }
  const query = carried.toString();
  return query ? `${basePath}?${query}` : basePath;
}
