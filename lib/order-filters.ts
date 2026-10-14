/**
 * URL-param parsing + link building for the orders drill-down page
 * (SPEC-038, backend SPEC-032; placed-date range SPEC-040). Pure and
 * unit-tested. The list fetch and the CSV export share `ordersApiQuery` so
 * they can never drift apart.
 */

import { isValidISODate } from "@/utils/date";

export type FulfillmentFilter = "unfulfilled" | "partial" | "fulfilled";
export type AgeBucket = "0_24" | "24_48" | "48_plus";
/** Orders page tab (SPEC-079, backend SPEC-071) — route-derived, never parsed
 * from the query string (see `parseOrderFilters`). */
export type OrdersView = "returns" | "cancelled" | "discounted";

const FULFILLMENT_VALUES: FulfillmentFilter[] = ["unfulfilled", "partial", "fulfilled"];
const AGE_VALUES: AgeBucket[] = ["0_24", "24_48", "48_plus"];
const LOCATION_PATTERN = /^(online|\d{1,20})$/;
const PRODUCT_PATTERN = /^\d{1,20}$/;

export const AGE_LABELS: Record<AgeBucket, string> = {
  "0_24": "0–24h",
  "24_48": "24–48h",
  "48_plus": "48h+",
};

export const FULFILLMENT_LABELS: Record<FulfillmentFilter, string> = {
  unfulfilled: "Unfulfilled",
  partial: "Partially fulfilled",
  fulfilled: "Fulfilled",
};

export interface OrderFilters {
  fulfillment: FulfillmentFilter | null;
  /** "online" or a numeric location id (backend contract). */
  location: string | null;
  /** Display-only name carried from the report link (`loc_name`). */
  locationName: string | null;
  /** Numeric product id (backend contract, SPEC-053) — the dashboard
   * returns-spike link (SPEC-059). */
  product: string | null;
  /** Display-only name carried from the link (`product_name`). */
  productName: string | null;
  age: AgeBucket | null;
  /** Placed-date range (SPEC-040, backend SPEC-033); null = all time. */
  from: string | null;
  to: string | null;
  q: string;
  page: number;
  /** Orders page tab (SPEC-079) — set by whichever route renders
   * `OrdersPageContent`, never read from the URL's query string. */
  view: OrdersView | null;
}

export function parseOrderFilters(
  params: Record<string, string | undefined>,
): OrderFilters {
  const fulfillment = FULFILLMENT_VALUES.includes(params.fulfillment as FulfillmentFilter)
    ? (params.fulfillment as FulfillmentFilter)
    : null;
  const location =
    params.location && LOCATION_PATTERN.test(params.location) ? params.location : null;
  const product =
    params.product && PRODUCT_PATTERN.test(params.product) ? params.product : null;
  const age = AGE_VALUES.includes(params.age as AgeBucket)
    ? (params.age as AgeBucket)
    : null;
  // Placed-date range: both valid or neither; clamp to today; swap inverted
  // pairs (mirrors resolveDateRange so hand-edited URLs never 422).
  let from: string | null = null;
  let to: string | null = null;
  if (
    params.from &&
    params.to &&
    isValidISODate(params.from) &&
    isValidISODate(params.to)
  ) {
    const todayISO = new Date().toISOString().slice(0, 10);
    from = params.from > todayISO ? todayISO : params.from;
    to = params.to > todayISO ? todayISO : params.to;
    if (from > to) [from, to] = [to, from];
  }
  return {
    fulfillment,
    location,
    locationName: location ? (params.loc_name ?? "").slice(0, 80) || null : null,
    product,
    productName: product ? (params.product_name ?? "").slice(0, 80) || null : null,
    age,
    from,
    to,
    q: (params.q ?? "").trim().slice(0, 80),
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
    view: null,
  };
}

/** Query string for `GET /orders` and `GET /orders/export` (no page/limit for export). */
export function ordersApiQuery(
  filters: OrderFilters,
  limit?: number,
  offset?: number,
): string {
  const params = new URLSearchParams();
  if (filters.fulfillment) params.set("fulfillment", filters.fulfillment);
  if (filters.location) params.set("location", filters.location);
  if (filters.product) params.set("product", filters.product);
  if (filters.age) params.set("age", filters.age);
  if (filters.from && filters.to) {
    params.set("start", filters.from);
    params.set("end", filters.to);
  }
  if (filters.q) params.set("search", filters.q);
  // Tab filter (SPEC-079, backend SPEC-071) — the actual backend request
  // needs it; it never appears in a frontend page URL (see ordersPageHref).
  if (filters.view) params.set("view", filters.view);
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  return params.toString();
}

/** The orders-page URL for a filter state (used by tabs + chips + pagination).
 * `basePath` (SPEC-079) picks which tab's route to land on — defaults to the
 * All tab so every existing caller (dashboard drill-downs, report links) is
 * unaffected. Deliberately never serializes `filters.view`: the route itself
 * (`basePath`) is what encodes the active tab, not a query param. */
export function ordersPageHref(
  filters: Partial<OrderFilters>,
  page = 1,
  basePath = "/orders",
): string {
  const params = new URLSearchParams();
  if (filters.fulfillment) params.set("fulfillment", filters.fulfillment);
  if (filters.location) {
    params.set("location", filters.location);
    if (filters.locationName) params.set("loc_name", filters.locationName);
  }
  if (filters.product) {
    params.set("product", filters.product);
    if (filters.productName) params.set("product_name", filters.productName);
  }
  if (filters.age) params.set("age", filters.age);
  if (filters.from && filters.to) {
    params.set("from", filters.from);
    params.set("to", filters.to);
  }
  if (filters.q) params.set("q", filters.q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Drill-down link for a report "unfulfilled by location" row (SPEC-038):
 * NULL location_id is the report's "Online / unattributed" bucket.
 */
export function drilldownHref(
  row: { location_id: number | null; location: string },
  age?: AgeBucket,
): string {
  return ordersPageHref({
    fulfillment: "unfulfilled",
    location: row.location_id === null ? "online" : String(row.location_id),
    locationName: row.location,
    age: age ?? null,
  });
}

/**
 * Orders-page link for the dashboard's returns-spike card (SPEC-059, backend
 * SPEC-053): filters to the one product driving the spike.
 */
export function returnsSpikeHref(productId: number, productName: string): string {
  return ordersPageHref({ product: String(productId), productName });
}

export interface FilterChip {
  label: string;
  /** URL with this one filter removed. */
  removeHref: string;
}

/** Active-filter chips; each links to the same page without that filter. */
export function filterChips(filters: OrderFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.fulfillment) {
    chips.push({
      label: FULFILLMENT_LABELS[filters.fulfillment],
      removeHref: ordersPageHref({ ...filters, fulfillment: null }),
    });
  }
  if (filters.location) {
    chips.push({
      label:
        filters.location === "online"
          ? "Online / unattributed"
          : (filters.locationName ?? `Location ${filters.location}`),
      removeHref: ordersPageHref({ ...filters, location: null, locationName: null }),
    });
  }
  if (filters.product) {
    chips.push({
      label: filters.productName ?? `Product ${filters.product}`,
      removeHref: ordersPageHref({ ...filters, product: null, productName: null }),
    });
  }
  if (filters.age) {
    chips.push({
      label: `Placed ${AGE_LABELS[filters.age]} ago`,
      removeHref: ordersPageHref({ ...filters, age: null }),
    });
  }
  return chips;
}

/** Header description, e.g. "Unfulfilled · North Store · 48h+". */
export function filterSummary(filters: OrderFilters): string {
  const parts = filterChips(filters).map((chip) => chip.label);
  return parts.length > 0 ? parts.join(" · ") : "All orders";
}

/** Guards the order-detail breadcrumb's `returnTo` param (SPEC-080) — must be
 * exactly one of the Orders tabs' own routes, optionally with a query string.
 * Never trust an arbitrary query param as a redirect target; a plain
 * `startsWith("/orders")` check would also pass `/orders.evil.example`. */
export function isSafeOrdersReturnPath(path: string): boolean {
  return /^\/orders(\/(returns|cancelled|discounted))?(\?[^\s]*)?$/.test(path);
}

/**
 * Display name for the active location (SPEC-039): the scopes list is the
 * source of truth; `loc_name` (report links) is the fallback; a generic
 * label is the last resort. Null when no location filter is active.
 */
export function locationLabel(
  filters: OrderFilters,
  locations: { id: number; name: string }[],
): string | null {
  if (!filters.location) return null;
  if (filters.location === "online") return "Online / unattributed";
  const match = locations.find((location) => String(location.id) === filters.location);
  return match?.name ?? filters.locationName ?? `Location ${filters.location}`;
}
