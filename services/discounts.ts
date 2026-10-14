/** Discount Monitoring service — server transport (backend SPEC-099). Since SPEC-230
 * the paths, keys and loaders live in `lib/queries/discounts.ts`; this module is
 * their `serverApi` face. The staff-name PUT goes through the proxy from the client. */
import { serverApi } from "@/lib/api";
import { discountQueries, type DiscountEmployeeTransactions } from "@/lib/queries/discounts";
import type { CannibalisationData } from "@/types/analysis";
import type {
  DiscountAlerts,
  DiscountAttention,
  DiscountEmployee,
  DiscountOverview,
  DiscountPromotion,
  DiscountReasons,
  DiscountTransactionDetail,
} from "@/types/discounts";

export function getDiscountOverview(start: string, end: string): Promise<DiscountOverview> {
  return discountQueries.overview(start, end).load(serverApi);
}

export function getDiscountReasons(start: string, end: string): Promise<DiscountReasons> {
  return discountQueries.reasons(start, end).load(serverApi);
}

export function getDiscountAttention(start: string, end: string): Promise<DiscountAttention> {
  return discountQueries.attention(start, end).load(serverApi);
}

export function getDiscountAutomatic(start: string, end: string): Promise<{ promotions: DiscountPromotion[] }> {
  return discountQueries.automatic(start, end).load(serverApi);
}

export function getDiscountEmployees(
  start: string,
  end: string,
  locationId?: number,
): Promise<{ employees: DiscountEmployee[] }> {
  return discountQueries.employees(start, end, locationId).load(serverApi);
}

export function getDiscountEmployeeTransactions(
  staffUserId: number,
  start: string,
  end: string,
): Promise<DiscountEmployeeTransactions> {
  return discountQueries.employeeTransactions(staffUserId, start, end).load(serverApi);
}

export function getDiscountTransaction(orderId: number): Promise<DiscountTransactionDetail> {
  return discountQueries.transaction(orderId).load(serverApi);
}

export function getDiscountAlerts(start: string, end: string): Promise<DiscountAlerts> {
  return discountQueries.alerts(start, end).load(serverApi);
}

/** Discount cannibalisation (backend SPEC-205 / frontend SPEC-186). */
export async function getDiscountCannibalisation(from: string, to: string): Promise<CannibalisationData> {
  return discountQueries.cannibalisation(from, to).load(serverApi);
}
