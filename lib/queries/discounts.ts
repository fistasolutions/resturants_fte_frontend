/** Discount Monitoring queries (backend SPEC-099; cannibalisation backend SPEC-205) —
 * defined once for both transports (SPEC-230). Byte-identical paths to the
 * pre-SPEC-230 `services/discounts.ts`. */
import {
  adaptCannibalisation,
  adaptDiscountDecisions,
  type ApiCannibalisation,
  type ApiDiscountDecisions,
} from "@/lib/adapters";
import { defineQuery } from "@/lib/query-def";
import type { CannibalisationData, DiscountDecisionsData } from "@/types/analysis";
import type {
  DiscountAlerts,
  DiscountAttention,
  DiscountEmployee,
  DiscountOverview,
  DiscountPromotion,
  DiscountReasons,
  DiscountTransaction,
  DiscountTransactionDetail,
} from "@/types/discounts";

export interface DiscountEmployeeTransactions {
  staff_user_id: number;
  staff_name: string | null;
  transactions: DiscountTransaction[];
}

function range(start: string, end: string): string {
  return new URLSearchParams({ start, end }).toString();
}

export const discountPaths = {
  overview: (start: string, end: string): string => `/discounts/overview?${range(start, end)}`,
  reasons: (start: string, end: string): string => `/discounts/reasons?${range(start, end)}`,
  attention: (start: string, end: string): string => `/discounts/attention?${range(start, end)}`,
  automatic: (start: string, end: string): string => `/discounts/automatic?${range(start, end)}`,
  employees: (start: string, end: string, locationId?: number): string => {
    const q = new URLSearchParams({ start, end });
    if (locationId !== undefined) q.set("location_id", String(locationId));
    return `/discounts/employees?${q.toString()}`;
  },
  employeeTransactions: (staffUserId: number, start: string, end: string): string =>
    `/discounts/employees/${staffUserId}/transactions?${range(start, end)}`,
  transaction: (orderId: number): string => `/discounts/transactions/${orderId}`,
  alerts: (start: string, end: string): string => `/discounts/alerts?${range(start, end)}`,
  cannibalisation: (from: string, to: string): string =>
    `/analysis/discount-cannibalisation?start=${from}&end=${to}`,
  decisions: (from: string, to: string): string =>
    `/discounts/decisions?start=${from}&end=${to}`,
} as const;

export const discountQueries = {
  overview: (start: string, end: string) =>
    defineQuery<DiscountOverview>(["discounts", "overview", { start, end }], (api) =>
      api<DiscountOverview>(discountPaths.overview(start, end)),
    ),
  reasons: (start: string, end: string) =>
    defineQuery<DiscountReasons>(["discounts", "reasons", { start, end }], (api) =>
      api<DiscountReasons>(discountPaths.reasons(start, end)),
    ),
  attention: (start: string, end: string) =>
    defineQuery<DiscountAttention>(["discounts", "attention", { start, end }], (api) =>
      api<DiscountAttention>(discountPaths.attention(start, end)),
    ),
  automatic: (start: string, end: string) =>
    defineQuery<{ promotions: DiscountPromotion[] }>(["discounts", "automatic", { start, end }], (api) =>
      api<{ promotions: DiscountPromotion[] }>(discountPaths.automatic(start, end)),
    ),
  employees: (start: string, end: string, locationId?: number) =>
    defineQuery<{ employees: DiscountEmployee[] }>(
      ["discounts", "employees", { start, end, locationId: locationId ?? null }],
      (api) => api<{ employees: DiscountEmployee[] }>(discountPaths.employees(start, end, locationId)),
    ),
  employeeTransactions: (staffUserId: number, start: string, end: string) =>
    defineQuery<DiscountEmployeeTransactions>(
      ["discounts", "employee-transactions", staffUserId, { start, end }],
      (api) => api<DiscountEmployeeTransactions>(discountPaths.employeeTransactions(staffUserId, start, end)),
    ),
  transaction: (orderId: number) =>
    defineQuery<DiscountTransactionDetail>(["discounts", "transaction", orderId], (api) =>
      api<DiscountTransactionDetail>(discountPaths.transaction(orderId)),
    ),
  alerts: (start: string, end: string) =>
    defineQuery<DiscountAlerts>(["discounts", "alerts", { start, end }], (api) =>
      api<DiscountAlerts>(discountPaths.alerts(start, end)),
    ),
  /** Discount cannibalisation (backend SPEC-205 / frontend SPEC-186). */
  cannibalisation: (from: string, to: string) =>
    defineQuery<CannibalisationData>(["discounts", "cannibalisation", { from, to }], async (api) =>
      adaptCannibalisation(await api<ApiCannibalisation>(discountPaths.cannibalisation(from, to))),
    ),
  /** Discount decisions (backend SPEC-251 / frontend SPEC-244). */
  decisions: (from: string, to: string) =>
    defineQuery<DiscountDecisionsData>(["discounts", "decisions", { from, to }], async (api) =>
      adaptDiscountDecisions(await api<ApiDiscountDecisions>(discountPaths.decisions(from, to))),
    ),
} as const;
