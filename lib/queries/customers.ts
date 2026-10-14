/**
 * Customer queries (SPEC-230) — Money Finder, segments and the repeat clock, defined
 * once for both transports. Byte-identical paths to the pre-SPEC-230
 * `services/customers.ts`.
 */
import {
  adaptCustomerHealth,
  adaptCustomerSegments,
  adaptRepeatClock,
  type ApiCustomerHealth,
  type ApiCustomerSegments,
  type ApiRepeatClock,
} from "@/lib/adapters";
import { defineQuery } from "@/lib/query-def";
import type {
  CustomerHealthData,
  CustomerSegmentsData,
  MoneyFinderResponse,
  RepeatClockData,
} from "@/types/customers";

export interface MoneyFinderQuery {
  page?: number;
  limit?: number;
  q?: string;
}

/** The backend's default (SPEC-253); it accepts up to 200. */
export const HEALTH_DEFAULT_LIMIT = 50;

export const customerPaths = {
  moneyFinder: ({ page = 1, limit = 15, q = "" }: MoneyFinderQuery = {}): string => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    return `/customers/money-finder?${params.toString()}`;
  },
  segments: (): string => "/analysis/customer-segments?period=90d",
  repeatClock: (): string => "/analysis/repeat-clock",
  health: (limit: number = HEALTH_DEFAULT_LIMIT): string => `/customers/health?limit=${limit}`,
} as const;

export const customerQueries = {
  moneyFinder: (query: MoneyFinderQuery = {}) =>
    defineQuery<MoneyFinderResponse>(
      ["customers", "money-finder", { page: query.page ?? 1, limit: query.limit ?? 15, q: query.q ?? "" }],
      (api) => api<MoneyFinderResponse>(customerPaths.moneyFinder(query)),
    ),
  /** Discount segments (backend SPEC-208 / frontend SPEC-189). */
  segments: () =>
    defineQuery<CustomerSegmentsData>(["customers", "segments"], async (api) =>
      adaptCustomerSegments(await api<ApiCustomerSegments>(customerPaths.segments())),
    ),
  /** Repeat-purchase clock (backend SPEC-209 / frontend SPEC-189). */
  repeatClock: () =>
    defineQuery<RepeatClockData>(["customers", "repeat-clock"], async (api) =>
      adaptRepeatClock(await api<ApiRepeatClock>(customerPaths.repeatClock())),
    ),
  /** Customer health — every platform's view of the top spenders (backend SPEC-253 / frontend SPEC-247). */
  health: (limit: number = HEALTH_DEFAULT_LIMIT) =>
    defineQuery<CustomerHealthData>(["customers", "health", limit], async (api) =>
      adaptCustomerHealth(await api<ApiCustomerHealth>(customerPaths.health(limit))),
    ),
} as const;
