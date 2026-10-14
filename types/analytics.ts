/**
 * Analytics contract — mirrors the future backend analytics engine responses.
 * All values arrive COMPUTED from the backend (root CLAUDE.md Rule 8); the
 * frontend only formats and displays them.
 */

export type KpiFormat = "currency" | "number" | "percent";

export type KpiId =
  | "revenue"
  | "orders"
  | "aov"
  | "returning_customer_rate"
  | "new_customers";

export interface Kpi {
  id: KpiId;
  label: string;
  /** Raw value: cents-free currency in store currency units, count, or 0–100 percent. */
  value: number;
  /**
   * Percent change vs the comparison period, e.g. 12.5 or -3.2 (the
   * returning-rate KPI carries percentage POINTS). Null when comparison is
   * off or the comparison window is empty (SPEC-037) — never a fake 0.
   */
  changePercent: number | null;
  format: KpiFormat;
}

export interface RevenuePoint {
  /** Short day label, e.g. "Sun". */
  day: string;
  /** ISO date the point represents. */
  date: string;
  /** Revenue for the selected period. */
  current: number;
  /** Revenue for the comparison period. */
  previous: number;
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  /** Shopify CDN product image; null when the product has none. */
  imageUrl: string | null;
}

export interface AlertsSummary {
  lowStockVariants: number;
  outOfStockVariants: number;
  highDiscountProducts: number;
  refundsAmount: number;
  refundsCount: number;
  /** Dollar value of inventory about to run out (SPEC-044). */
  lowStockRevenueAtRisk: number;
  /** Products with zero sales in 90 days (SPEC-044). */
  deadStockProducts: number;
  /** Inventory value tied up in dead stock (SPEC-044). */
  deadStockValue: number;
  /** Worst-offending product by return rate; null if no spike (SPEC-044). */
  returnsSpikeProduct: string | null;
  /** Its product id, for linking to the filtered orders list; null if no
   * spike (SPEC-059, backend SPEC-053). */
  returnsSpikeProductId: number | null;
  /** Return rate 0–100%; null if no spike (SPEC-044). */
  returnsSpikeRate: number | null;
  /** Dollar value unfulfilled >48h, all locations. */
  unfulfilledValue: number;
  /** Order count unfulfilled >48h, all locations. */
  unfulfilledCount: number;
  /** True once today's overdue list has been sent from ANY page (Brief,
   * Overdue-review, or here) — one shared record, not tracked per page. */
  unfulfilledSent: boolean;
  /** ISO timestamp of that send; null until sent. */
  unfulfilledSentAt: string | null;
}

/** One row of the returns-spike "top styles" page (SPEC-070, backend SPEC-054).
 * `orderId` (SPEC-073, backend SPEC-068) is the product's most recently
 * refunded qualifying order — null only if the backend can't resolve one. */
export interface ReturnsSpikeItem {
  product: string;
  productId: number;
  ratePct: number;
  orderId: number | null;
}

export interface ChannelShare {
  channel: string;
  /** Share of sales, 0–1. */
  share: number;
}
