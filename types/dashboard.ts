import type { CalendarNote } from "@/lib/calendar-note";
import type {
  AlertsSummary,
  ChannelShare,
  Kpi,
  RevenuePoint,
  TopProduct,
} from "./analytics";
import type { RecentOrder } from "./orders";

export interface LocationKpiSeries {
  label: string;
  revenue: number;
}

export interface LocationKpi {
  location_id: number | null;
  /**
   * Sales channel for cards that are not a physical location — "Online Store",
   * "Draft Orders", "Other apps" (backend SPEC-202). Null for POS locations.
   */
  channel: string | null;
  name: string;
  revenue: number;
  orders: number;
  aov: number;
  new_customers: number;
  returning_customers: number;
  unfulfilled: number;
  top_product: string | null;
  top_product_revenue: number | null;
  revenue_series: LocationKpiSeries[];
}

export interface LocationKpisData {
  period: { key: string; start: string; end: string; hourly: boolean };
  locations: LocationKpi[];
}

/**
 * Shopify's sales waterfall (backend SPEC-201): gross sales − discounts − returns.
 * Deliberately a different basis from the Revenue KPI, which is order totals and so
 * includes tax and shipping.
 */
export interface NetSales {
  grossSales: number;
  discounts: number;
  returns: number;
  netSales: number;
}

export interface DashboardData {
  /** ISO date of the selected period's end, e.g. "2026-05-15". */
  periodDate: string;
  /** Human label of the selected range, e.g. "Last 7 days". */
  periodLabel: string;
  /** Short comparison suffix for KPI deltas; null when comparison is off. */
  comparisonShortLabel: string | null;
  /** False with compare=none — the chart drops its previous-period line. */
  showComparison: boolean;
  /** Festivals in the range and in the compared window (SPEC-307); null when the
   * comparison is off or the backend predates SPEC-305. */
  calendarNote: CalendarNote | null;
  kpis: Kpi[];
  /** Null when the backend predates SPEC-201 — the card is then not rendered. */
  netSales: NetSales | null;
  /** Null when unavailable — a supporting card, never the page (SPEC-190). */
  whatChanged: WhatChanged | null;
  revenueSeries: RevenuePoint[];
  topProducts: TopProduct[];
  alerts: AlertsSummary;
  recentOrders: RecentOrder[];
  channels: ChannelShare[];
}


/** What changed, and why (backend SPEC-214 / frontend SPEC-190). */
export interface RevenueMover {
  productId: number;
  title: string;
  category: string;
  revenueNow: number;
  revenuePrev: number;
  delta: number;
  unitsNow: number;
  unitsPrev: number;
  onHand: number;
  signal: string;
  /** Null when the store's total change is zero — there is no share of nothing. */
  shareOfChangePct: number | null;
}

export interface WhatChanged {
  summary: {
    revenueNow: number;
    revenuePrev: number;
    totalDelta: number;
    totalDeltaPct: number | null;
    productsMoved: number;
    concentrationPct: number;
  };
  movers: RevenueMover[];
}

/** ── SPEC-237 / backend SPEC-244 — money at stake ── */

export type DashboardMoneyKey = "trapped" | "leaking" | "at_risk";

export interface DashboardMoneyLine {
  key: string;
  label: string;
  amount: number;
  count: number;
  /** "products" | "orders" | "codes" | "variants" | "customers" — the count's noun. */
  unit: string;
  /** "Move stock" — the verb on the link. */
  action: string;
  /** The page that fixes it, carrying the window the figure was computed over. */
  href: string;
}

export interface DashboardMoneyNumber {
  key: DashboardMoneyKey;
  title: string;
  question: string;
  /** Sum of `lines[].amount`; 0 with no lines is a real zero. */
  total: number;
  /** Largest first. */
  lines: DashboardMoneyLine[];
}

export interface DashboardMoney {
  generated_at: string;
  window_days: number;
  /** Fixed order: trapped → leaking → at_risk. */
  numbers: DashboardMoneyNumber[];
  /** Producers that failed — their lines are absent, not zero. */
  sources_missing: string[];
}
