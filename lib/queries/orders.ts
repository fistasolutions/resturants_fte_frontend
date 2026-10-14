/**
 * Orders queries (SPEC-230) — the drill-down list (SPEC-038, backend SPEC-032), the
 * order detail (SPEC-061, backend SPEC-055) and the review-by-location sheets, defined
 * once for both transports. Byte-identical paths to the pre-SPEC-230 `services/orders.ts`.
 */
import type { ApiListEnvelope, ApiOrder, ApiOrderDetail } from "@/lib/adapters";
import { ordersApiQuery, type OrderFilters } from "@/lib/order-filters";
import { defineQuery } from "@/lib/query-def";

export interface OrderReviewRow {
  order_name: string;
  hours: number;
  customer: string;
  value: number;
}

export interface OrderReviewSheet {
  location_key: string;
  location_name: string;
  /** SPEC-057 — null when this location has no manager email configured yet. */
  manager_email: string | null;
  total_value: number;
  orders: OrderReviewRow[];
}

export interface OrdersReviewByLocation {
  total_orders: number;
  total_value: number;
  oldest_hours: number;
  sheets: OrderReviewSheet[];
}

export const orderPaths = {
  list: (filters: OrderFilters, limit: number, offset: number): string =>
    `/orders?${ordersApiQuery(filters, limit, offset)}`,
  detail: (orderId: string): string => `/orders/${orderId}`,
  /** `query` is the backend query string `ordersApiQuery(filters)` produces. */
  reviewByLocation: (query: string): string =>
    `/orders/review-by-location${query ? `?${query}` : ""}`,
} as const;

export const orderQueries = {
  /** One page of the list; the page number is part of the key, so pages already
   * visited paint instantly when paged back to. */
  list: (filters: OrderFilters, pageSize: number) =>
    defineQuery<ApiListEnvelope<ApiOrder>>(
      ["orders", "list", { ...filters }, pageSize],
      (api) =>
        api<ApiListEnvelope<ApiOrder>>(
          orderPaths.list(filters, pageSize, (filters.page - 1) * pageSize),
        ),
    ),
  detail: (orderId: string) =>
    defineQuery<ApiOrderDetail>(["orders", "detail", orderId], (api) =>
      api<ApiOrderDetail>(orderPaths.detail(orderId)),
    ),
  reviewByLocation: (query: string) =>
    defineQuery<OrdersReviewByLocation>(["orders", "review-by-location", query], (api) =>
      api<OrdersReviewByLocation>(orderPaths.reviewByLocation(query)),
    ),
} as const;
