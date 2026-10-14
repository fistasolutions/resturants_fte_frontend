/**
 * Pure tab model + routing for the Discount Monitoring workspace (SPEC-098),
 * mirroring the Gorgias workspace (SPEC-094). Framework-free / unit-testable;
 * shared by the persistent shell and the tab bar. The drill routes
 * (`/discounts/locations/[id]`, `/employees/[id]`, `/transactions/[id]`) are
 * NOT tabs — they render bare with a breadcrumb (shell self-gates).
 */

export type DiscountTab =
  | "overview"
  | "attention"
  | "staff"
  | "reasons"
  | "cannibalisation"
  | "decisions";

export interface DiscountTabDef {
  key: DiscountTab;
  label: string;
  basePath: string;
}

export const DISCOUNT_TABS: DiscountTabDef[] = [
  { key: "overview", label: "Overview", basePath: "/discounts" },
  { key: "attention", label: "Needs attention", basePath: "/discounts/attention" },
  { key: "staff", label: "Staff", basePath: "/discounts/staff" },
  { key: "reasons", label: "Reasons", basePath: "/discounts/reasons" },
  // SPEC-186: how much of each code's discount went to customers who had already
  // bought — the acquisition-vs-cannibalisation split.
  {
    key: "cannibalisation",
    label: "Cannibalisation",
    basePath: "/discounts/cannibalisation",
  },
  // SPEC-244: what the whole store did while each code ran vs just before.
  { key: "decisions", label: "Decisions", basePath: "/discounts/decisions" },
];

export const RANGE_PARAM_KEYS = ["range", "from", "to"] as const;

const TAB_BY_PATH = new Map(DISCOUNT_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/** The tab whose route is EXACTLY this pathname, else null (any drill route). */
export function activeDiscountTab(pathname: string): DiscountTab | null {
  return TAB_BY_PATH.get(normalizePath(pathname))?.key ?? null;
}

/** Default to the last 30 days when the URL carries no explicit range. */
export function withDiscountDefaultRange(
  params: Record<string, string | undefined>,
): Record<string, string | undefined> {
  if (params.range || (params.from && params.to) || params.date) {
    return params;
  }
  return { ...params, range: "30d" };
}

/** A path/basePath with only the date-range params carried forward. */
export function discountHref(basePath: string, params: URLSearchParams): string {
  const carried = new URLSearchParams();
  for (const key of RANGE_PARAM_KEYS) {
    const value = params.get(key);
    if (value) carried.set(key, value);
  }
  const query = carried.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** The carried date-range as a query string with a leading "?", or "" — for
 * appending to drill-down hrefs so the selected range survives the drill. */
export function rangeQuery(params: Record<string, string | undefined>): string {
  const carried = new URLSearchParams();
  for (const key of RANGE_PARAM_KEYS) {
    const value = params[key];
    if (value) carried.set(key, value);
  }
  const query = carried.toString();
  return query ? `?${query}` : "";
}
