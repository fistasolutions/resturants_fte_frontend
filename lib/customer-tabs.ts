/**
 * Pure tab model + routing for the Customers workspace (SPEC-189), mirroring
 * `lib/product-tabs.ts`. Framework-free so it is unit-testable and shared by the
 * persistent shell and the tab bar without pulling either into a test.
 */

export type CustomerTabKey = "money-finder" | "segments" | "repeat-clock" | "health";

export interface CustomerTabDef {
  key: CustomerTabKey;
  label: string;
  basePath: string;
}

export const CUSTOMER_TABS: CustomerTabDef[] = [
  { key: "money-finder", label: "Money Finder", basePath: "/customers" },
  { key: "segments", label: "Segments", basePath: "/customers/segments" },
  { key: "repeat-clock", label: "Repeat Clock", basePath: "/customers/repeat-clock" },
  { key: "health", label: "Health", basePath: "/customers/health" },
];

const TAB_BY_PATH = new Map(CUSTOMER_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * The tab whose route is EXACTLY this pathname, or null on any nested route —
 * `/customers/winback` keeps its own header rather than showing a tab bar with
 * nothing selected.
 */
export function activeCustomerTab(pathname: string): CustomerTabKey | null {
  return TAB_BY_PATH.get(normalizePath(pathname))?.key ?? null;
}

/** True on exactly the four tab routes; false on their detail routes. */
export function isCustomerTabRoute(pathname: string): boolean {
  return activeCustomerTab(pathname) !== null;
}
