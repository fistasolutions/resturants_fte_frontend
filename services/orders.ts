/**
 * Orders service — server transport (SPEC-038): the drill-down list, filters per
 * backend SPEC-032. Since SPEC-230 the paths, keys and loaders live in
 * `lib/queries/orders.ts` so the client cache refetches the same definitions
 * through `/api/proxy`; this module is their `serverApi` face.
 */
import type { ApiListEnvelope, ApiOrder, ApiOrderDetail } from "@/lib/adapters";
import { serverApi } from "@/lib/api";
import type { OrderFilters } from "@/lib/order-filters";
import { orderQueries, type OrdersReviewByLocation } from "@/lib/queries/orders";

export type {
  OrderReviewRow,
  OrderReviewSheet,
  OrdersReviewByLocation,
} from "@/lib/queries/orders";

export async function getOrders(
  filters: OrderFilters,
  limit: number,
  offset: number,
): Promise<ApiListEnvelope<ApiOrder>> {
  // The query definition derives the offset from `filters.page`; callers have always
  // passed `(page - 1) * limit`, so the two agree by construction.
  const page = Math.floor(offset / limit) + 1;
  return orderQueries.list({ ...filters, page }, limit).load(serverApi);
}

/** Single order drill-down page (SPEC-061, backend SPEC-055). */
export async function getOrderDetail(orderId: string): Promise<ApiOrderDetail> {
  return orderQueries.detail(orderId).load(serverApi);
}

export async function getOrdersReviewByLocation(
  query: string,
): Promise<OrdersReviewByLocation> {
  return orderQueries.reviewByLocation(query).load(serverApi);
}
