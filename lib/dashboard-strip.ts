/**
 * The Dashboard's KPI strip (SPEC-233): the five backend KPIs with Net sales inserted
 * after Revenue, as tiles for the shared `KpiStrip`. Pure and Vitest-covered; the
 * numbers are the backend's (root Rule 8) — this formats and decides the sub-line.
 */

import type { StripTile } from "@/lib/kpi-strip";
import type { Kpi } from "@/types/analytics";
import type { NetSales } from "@/types/dashboard";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

/** The same links the KPI cards carried since SPEC-004. */
const KPI_HREF: Partial<Record<Kpi["id"], string>> = {
  orders: "/orders",
  new_customers: "/customers",
};

/** Shorter tile labels than the cards' — the strip has a sixth of the width. */
const KPI_LABEL: Record<Kpi["id"], string> = {
  revenue: "Revenue",
  orders: "Orders",
  aov: "Avg order",
  returning_customer_rate: "Returning customers",
  new_customers: "New customers",
};

export function formatKpiValue(kpi: Kpi): string {
  switch (kpi.format) {
    case "currency":
      return formatCurrency(kpi.value);
    case "percent":
      return formatPercent(kpi.value);
    case "number":
      return formatNumber(kpi.value);
  }
}

/**
 * "vs Aug 30 – Sep 5, 2026 (same time)" → "vs Aug 30 – Sep 5 (same time)": a tile is a
 * sixth of the page, and the year is only news when it is not this year.
 */
export function tileComparisonLabel(label: string, todayISO: string): string {
  const year = todayISO.slice(0, 4);
  return label.replace(new RegExp(`, ${year}(?=\\s|$)`), "");
}

function kpiTile(kpi: Kpi, comparisonShortLabel: string | null, todayISO: string): StripTile {
  // Null = comparison off or no baseline (SPEC-037) — never a fake 0%. The strip
  // then shows the comparison label alone (or nothing), not a dash.
  const hasDelta = kpi.changePercent !== null && comparisonShortLabel !== null;
  return {
    key: kpi.id,
    label: KPI_LABEL[kpi.id],
    value: formatKpiValue(kpi),
    delta: hasDelta ? kpi.changePercent : null,
    invertDelta: false,
    sub: hasDelta ? tileComparisonLabel(comparisonShortLabel as string, todayISO) : "",
    tone: "neutral",
    href: KPI_HREF[kpi.id],
  };
}

export function netSalesTile(netSales: NetSales): StripTile {
  return {
    key: "net_sales",
    label: "Net sales",
    value: formatCurrency(netSales.netSales),
    delta: null,
    invertDelta: false,
    sub: "after discounts & returns",
    tone: "neutral",
  };
}

/**
 * Six tiles when the backend serves net sales (SPEC-201), five when it does not —
 * the same gate the waterfall card had. Net sales sits right after Revenue because
 * it is Revenue's honest counterpart, not a sixth unrelated number.
 */
export function buildDashboardStrip(
  kpis: Kpi[],
  netSales: NetSales | null,
  comparisonShortLabel: string | null,
  todayISO: string = new Date().toISOString().slice(0, 10),
): StripTile[] {
  const tiles: StripTile[] = [];
  for (const kpi of kpis) {
    tiles.push(kpiTile(kpi, comparisonShortLabel, todayISO));
    if (kpi.id === "revenue" && netSales) tiles.push(netSalesTile(netSales));
  }
  return tiles;
}
