/**
 * Pure tab model + routing helpers for the Orders page (SPEC-087, building on
 * SPEC-079). Framework-free so it's unit-testable and shared by the persistent
 * shell and the tab bar. Tab links reuse `ordersPageHref` from `order-filters`.
 */

export type OrdersTab = "all" | "returns" | "cancelled" | "discounted";

export interface OrdersTabDef {
  key: OrdersTab;
  label: string;
  basePath: string;
}

export const ORDERS_TABS: OrdersTabDef[] = [
  { key: "all", label: "All", basePath: "/orders" },
  // "Returned Orders" — this is a filtered orders list, not the Returns Analytics
  // workspace at /returns (SPEC-154). Route key/basePath unchanged.
  { key: "returns", label: "Returned Orders", basePath: "/orders/returns" },
  { key: "cancelled", label: "Cancelled", basePath: "/orders/cancelled" },
  { key: "discounted", label: "Discounted", basePath: "/orders/discounted" },
];

const TAB_BY_PATH = new Map(ORDERS_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * The tab whose route is EXACTLY this pathname, or `null` on any nested/detail
 * route (`/orders/123`, `/orders/review`, `/orders/returns-spike`). Exact match —
 * never a prefix — so the persistent shell renders only on the four tab pages and
 * detail pages keep their own header.
 */
export function activeOrdersTab(pathname: string): OrdersTab | null {
  return TAB_BY_PATH.get(normalizePath(pathname))?.key ?? null;
}

/** True on exactly the four Orders tab routes; false on their detail routes. */
export function isOrdersTabRoute(pathname: string): boolean {
  return activeOrdersTab(pathname) !== null;
}
