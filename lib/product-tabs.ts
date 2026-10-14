/**
 * Pure tab model + routing helpers for the Product Analyst page (SPEC-090).
 * Framework-free so it's unit-testable and shared by the persistent shell and
 * the tab bar without pulling either into a test. Mirrors `lib/inventory-tabs.ts`.
 */

export type ProductTabKey =
  | "overview"
  | "catalog"
  | "returns"
  | "fit"
  | "true-profit"
  | "content-gaps"
  | "bundles"
  | "brands"
  | "costs";

export interface ProductTabDef {
  key: ProductTabKey;
  label: string;
  basePath: string;
}

export const PRODUCT_TABS: ProductTabDef[] = [
  { key: "overview", label: "Overview", basePath: "/products" },
  { key: "catalog", label: "Catalog", basePath: "/products/catalog" },
  // "Return Leak" — product-level return money-leak, not the Returns Analytics
  // workspace at /returns (SPEC-154). Route key/basePath unchanged.
  { key: "returns", label: "Return Leak", basePath: "/products/returns" },
  // SPEC-306: which way each style fits, and the size guide its returns earn — read over
  // the whole return history, so this tab takes no date range.
  { key: "fit", label: "Fit", basePath: "/products/fit" },
  // SPEC-185: what a product actually earned after COGS, discounts and returns —
  // the only product view that is not ranked by revenue.
  { key: "true-profit", label: "True Profit", basePath: "/products/true-profit" },
  // SPEC-213: which selling products have a thin page — where the image
  // generation the platform already has is worth pointing.
  { key: "content-gaps", label: "Content Gaps", basePath: "/products/content-gaps" },
  // SPEC-191: pairs ranked by margin, not by how often they happen to co-occur.
  { key: "bundles", label: "Bundles", basePath: "/products/bundles" },
  // SPEC-239: buy more / buy less / stop per brand — the buyer's pre-season list.
  { key: "brands", label: "Brands", basePath: "/products/brands" },
  // SPEC-251: what a garment really cost by the time it reached the shelf — the
  // owner's landed-cost entry, coverage and reconciliation (backend SPEC-256).
  { key: "costs", label: "Costs", basePath: "/products/costs" },
];

/** Tabs that read the whole history rather than a date range — the shell hides the picker. */
export const RANGELESS_PRODUCT_TABS: ReadonlySet<ProductTabKey> = new Set(["fit"]);

const TAB_BY_PATH = new Map(PRODUCT_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * The tab whose route is EXACTLY this pathname, or `null` on any nested/detail
 * route. Exact match — never a prefix — so the persistent shell renders only on
 * the three tab pages and any future detail page keeps its own header.
 */
export function activeProductTab(pathname: string): ProductTabKey | null {
  return TAB_BY_PATH.get(normalizePath(pathname))?.key ?? null;
}

/** True on exactly the three Product tab routes; false on their detail routes. */
export function isProductTabRoute(pathname: string): boolean {
  return activeProductTab(pathname) !== null;
}

/** Range keys the tab bar carries across a switch — everything else is dropped. */
const CARRIED_RANGE_PARAMS = ["range", "from", "to", "period"] as const;

/**
 * A tab link that preserves the active date range across the switch, carrying
 * only the range-related params so a custom range survives; `page`, `compare`,
 * etc. are intentionally not carried between tabs.
 */
export function productTabHref(basePath: string, current: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of CARRIED_RANGE_PARAMS) {
    const value = current.get(key);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
