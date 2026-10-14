/**
 * The executive report's KPI strip (SPEC-288): the six figures the Financials and
 * Operations rows used to show, as tiles for the shared `KpiStrip`. Pure and
 * Vitest-covered; every number is the report payload's (root Rule 8) — this formats
 * and decides the sub-line and the delta.
 */

import type { StripTile } from "@/lib/kpi-strip";
import type { ReportMetrics } from "@/types/reports";
import { formatCurrency, formatNumber } from "@/utils/format";

/** What the payload's `change_pct` compares against, by report period. */
const COMPARISON: Record<string, string> = {
  daily: "vs prior day",
  weekly: "vs prior 7 days",
  monthly: "vs prior 30 days",
};

/** Sub-line for the pending margin — visibly pending, never a fake zero (SPEC-034). */
export const MARGIN_PENDING = "Pending · fill cost-per-item in Shopify";

export function comparisonLabel(periodLabel: string): string {
  return COMPARISON[periodLabel] ?? `vs prior ${periodLabel}`;
}

/**
 * Six tiles — gross revenue, net revenue, product margin, orders, AOV, refunds — or
 * none when the payload has no `sales` block (older reports never had the tiles).
 */
export function buildReportStrip(metrics: ReportMetrics, periodLabel = "daily"): StripTile[] {
  const sales = metrics.sales;
  if (!sales) return [];
  const vs = comparisonLabel(periodLabel);
  const change = sales.change_pct;
  const margin = metrics.margin;
  const refunds = metrics.refunds;
  const marginKnown = margin !== undefined && margin.margin_pct !== null;

  const delta = (value: number | null | undefined): number | null =>
    value === null || value === undefined ? null : value;

  return [
    {
      key: "gross_revenue",
      label: "Gross revenue",
      value: formatCurrency(sales.gross_revenue),
      delta: delta(change?.gross_revenue),
      invertDelta: false,
      sub: delta(change?.gross_revenue) === null ? "" : vs,
      tone: "neutral",
    },
    {
      key: "net_revenue",
      label: "Net revenue",
      value: formatCurrency(sales.net_revenue),
      delta: null,
      invertDelta: false,
      sub: "after refunds",
      tone: "neutral",
    },
    {
      key: "product_margin",
      label: "Product margin",
      value: marginKnown ? `${margin.margin_pct}%` : "—",
      delta: null,
      invertDelta: false,
      sub: marginKnown ? `on ${margin.coverage_pct}% of revenue` : MARGIN_PENDING,
      tone: "neutral",
    },
    {
      key: "orders",
      label: "Orders",
      value: formatNumber(sales.orders),
      delta: delta(change?.orders),
      invertDelta: false,
      sub: delta(change?.orders) === null ? "" : vs,
      tone: "neutral",
    },
    {
      key: "aov",
      label: "AOV",
      value: formatCurrency(sales.aov),
      delta: delta(change?.aov),
      invertDelta: false,
      sub: delta(change?.aov) === null ? "" : vs,
      tone: "neutral",
    },
    {
      key: "refunds",
      label: "Refunds",
      value: refunds ? `${refunds.pct_of_revenue}%` : formatCurrency(sales.refunds_total),
      delta: null,
      invertDelta: true,
      sub: refunds
        ? `${formatNumber(refunds.count)} refunds · ${formatCurrency(refunds.total)}`
        : "of gross revenue",
      tone: "neutral",
    },
  ];
}
