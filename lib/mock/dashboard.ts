/**
 * Phase 1 mock fixtures for the dashboard (root CLAUDE.md Rule 6 exception).
 * Replaced by the real analytics API in Phase 8 — components never import this
 * file directly; they go through `services/dashboard.ts`.
 */
import type { DashboardData } from "@/types/dashboard";

/** The date the mock snapshot describes — the default selected period. */
export const MOCK_SNAPSHOT_DATE = "2026-05-15";

export const mockDashboardData: DashboardData = {
  periodDate: MOCK_SNAPSHOT_DATE,
  periodLabel: "May 15, 2026",
  comparisonShortLabel: "vs yesterday",
  showComparison: true,
  calendarNote: null,
  netSales: null,
  whatChanged: null,
  kpis: [
    {
      id: "revenue",
      label: "Total Revenue",
      value: 24130.5,
      changePercent: 12.5,
      format: "currency",
    },
    {
      id: "orders",
      label: "Orders",
      value: 214,
      changePercent: 8.3,
      format: "number",
    },
    {
      id: "aov",
      label: "Average Order Value",
      value: 112.77,
      changePercent: 3.6,
      format: "currency",
    },
    {
      id: "returning_customer_rate",
      label: "Returning Customer %",
      value: 34.2,
      changePercent: 5.2,
      format: "percent",
    },
    {
      id: "new_customers",
      label: "New Customers",
      value: 68,
      changePercent: 14.7,
      format: "number",
    },
  ],
  revenueSeries: [
    { day: "Sun", date: "2026-05-10", current: 9800, previous: 4200 },
    { day: "Mon", date: "2026-05-11", current: 13400, previous: 8600 },
    { day: "Tue", date: "2026-05-12", current: 11900, previous: 10400 },
    { day: "Wed", date: "2026-05-13", current: 15200, previous: 9100 },
    { day: "Thu", date: "2026-05-14", current: 21400, previous: 14800 },
    { day: "Fri", date: "2026-05-15", current: 24130.5, previous: 17200 },
    { day: "Sat", date: "2026-05-16", current: 26800, previous: 19600 },
  ],
  topProducts: [
    { id: "prod_1", name: "Premium Hoodie", revenue: 4250.5, orders: 212, imageUrl: null },
    { id: "prod_2", name: "Classic T-Shirt", revenue: 3120, orders: 156, imageUrl: null },
    { id: "prod_3", name: "Leather Wallet", revenue: 2890.75, orders: 98, imageUrl: null },
    { id: "prod_4", name: "Sneaker Pro", revenue: 2540, orders: 74, imageUrl: null },
    { id: "prod_5", name: "Cap Collection", revenue: 1980.25, orders: 65, imageUrl: null },
  ],
  alerts: {
    lowStockVariants: 12,
    outOfStockVariants: 5,
    highDiscountProducts: 8,
    refundsAmount: 1230,
    refundsCount: 4,
    lowStockRevenueAtRisk: 0,
    deadStockProducts: 0,
    deadStockValue: 0,
    returnsSpikeProduct: null,
    returnsSpikeProductId: null,
    returnsSpikeRate: null,
    unfulfilledValue: 0,
    unfulfilledCount: 0,
    unfulfilledSent: false,
    unfulfilledSentAt: null,
  },
  recentOrders: [
    {
      id: "ord_1058",
      number: "#1058",
      customerName: "John Smith",
      total: 189.5,
      status: "paid",
      createdAt: "2026-05-15T09:42:00Z",
    },
    {
      id: "ord_1057",
      number: "#1057",
      customerName: "Emily Johnson",
      total: 249,
      status: "paid",
      createdAt: "2026-05-15T08:15:00Z",
    },
    {
      id: "ord_1056",
      number: "#1056",
      customerName: "Michael Brown",
      total: 99.99,
      status: "paid",
      createdAt: "2026-05-14T19:27:00Z",
    },
    {
      id: "ord_1055",
      number: "#1055",
      customerName: "Sarah Williams",
      total: 159,
      status: "refunded",
      createdAt: "2026-05-14T16:03:00Z",
    },
  ],
  channels: [
    { channel: "Online Store", share: 0.684 },
    { channel: "Shopify Mobile", share: 0.187 },
    { channel: "POS", share: 0.098 },
    { channel: "Other", share: 0.031 },
  ],
};
