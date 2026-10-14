/**
 * Pure tab model + routing helpers for the Inventory Analyst page (SPEC-085,
 * building on SPEC-083). Kept framework-free so it's unit-testable and shared
 * by the persistent shell and the tab bar without pulling either into a test.
 */

export type InventoryTabKey =
  | "overview"
  | "reorder"
  | "overstock-movers"
  | "transfers"
  | "dead-stock"
  | "by-location"
  | "buy-plan"
  | "cash-release"
  | "allocation"
  | "data-trust";

export interface InventoryTabDef {
  key: InventoryTabKey;
  label: string;
  basePath: string;
  /** Dead Inventory has a fixed 7-day window — it shows no date-range picker. */
  hasRange: boolean;
}

export const INVENTORY_TABS: InventoryTabDef[] = [
  { key: "overview", label: "Overview", basePath: "/inventory", hasRange: true },
  { key: "reorder", label: "Reorder", basePath: "/inventory/reorder", hasRange: true },
  {
    key: "overstock-movers",
    label: "Overstock & Movers",
    basePath: "/inventory/overstock-movers",
    hasRange: true,
  },
  // "Warehouse → Store" names the transfer direction this tab plans, disambiguating
  // it from store↔store `/inventory/store-transfers` and the send flow
  // `/inventory/transfers/review` (SPEC-155). Route key/basePath unchanged.
  { key: "transfers", label: "Warehouse → Store", basePath: "/inventory/transfers", hasRange: true },
  {
    key: "dead-stock",
    label: "Dead Stock",
    basePath: "/inventory/dead-stock",
    hasRange: false,
  },
  { key: "by-location", label: "By Location", basePath: "/inventory/by-location", hasRange: true },
  // SPEC-211: the reorder decision in the shape it is actually made — units split
  // across sizes, not a single total like the Reorder tab above.
  { key: "buy-plan", label: "Buy Plan", basePath: "/inventory/buy-plan", hasRange: true },
  // SPEC-218: dead stock as a dated six-week recovery schedule. No range — the
  // plan is the state of the stockroom now, same reasoning as Dead Stock.
  {
    key: "cash-release",
    label: "Cash Release",
    basePath: "/inventory/cash-release",
    hasRange: false,
  },
  // SPEC-220: every store-to-store move worth making, grouped into van runs.
  {
    key: "allocation",
    label: "Allocation",
    basePath: "/inventory/allocation",
    hasRange: false,
  },
  // SPEC-217: what in the catalogue is wrong and what it cost. No range — this is
  // the state of the catalogue right now, not a windowed measurement.
  {
    key: "data-trust",
    label: "Data Trust",
    basePath: "/inventory/data-trust",
    hasRange: false,
  },
];

const TAB_BY_PATH = new Map(INVENTORY_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * The tab whose route is EXACTLY this pathname, or `null` on any nested/detail
 * route (`/inventory/dead-inventory-alerts/123/loc`, `/inventory/store-transfers`,
 * `/inventory/markdown-plan`). Exact match — never a prefix — so the persistent
 * shell renders only on the six tab pages and detail pages keep their own header.
 */
export function activeInventoryTab(pathname: string): InventoryTabKey | null {
  return TAB_BY_PATH.get(normalizePath(pathname))?.key ?? null;
}

/** True on exactly the six Inventory tab routes; false on their detail routes. */
export function isInventoryTabRoute(pathname: string): boolean {
  return activeInventoryTab(pathname) !== null;
}

/** Range keys the tab bar carries across a switch — everything else is dropped. */
const CARRIED_RANGE_PARAMS = ["range", "from", "to", "period"] as const;

/**
 * A tab link that preserves the active date range across the switch (SPEC-083),
 * carrying only the range-related params so a custom range survives; `page`,
 * `compare`, etc. are intentionally not carried between tabs.
 */
export function inventoryTabHref(
  basePath: string,
  current: URLSearchParams,
): string {
  const params = new URLSearchParams();
  for (const key of CARRIED_RANGE_PARAMS) {
    const value = current.get(key);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
