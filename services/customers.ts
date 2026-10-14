/** Customers service — server transport. Since SPEC-230 the paths, keys and loaders
 * live in `lib/queries/customers.ts` so the client cache refetches the same
 * definitions through `/api/proxy`; this module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { customerQueries, type MoneyFinderQuery } from "@/lib/queries/customers";
import type {
  CustomerHealthData,
  CustomerSegmentsData,
  MoneyFinderResponse,
  RepeatClockData,
} from "@/types/customers";

export type { MoneyFinderQuery } from "@/lib/queries/customers";

export async function getMoneyFinder(query: MoneyFinderQuery = {}): Promise<MoneyFinderResponse> {
  return customerQueries.moneyFinder(query).load(serverApi);
}

/** Discount segments (backend SPEC-208 / frontend SPEC-189). */
export async function getCustomerSegments(): Promise<CustomerSegmentsData> {
  return customerQueries.segments().load(serverApi);
}

/** Repeat-purchase clock (backend SPEC-209 / frontend SPEC-189). */
export async function getRepeatClock(): Promise<RepeatClockData> {
  return customerQueries.repeatClock().load(serverApi);
}

export async function getCustomerHealth(limit?: number): Promise<CustomerHealthData> {
  return customerQueries.health(limit).load(serverApi);
}
