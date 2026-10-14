/**
 * The Morning Brief's KPI strip (SPEC-231) — six small tiles under the header.
 *
 * Pure: every tile's label, value, delta and tone is decided here, in the layer Vitest
 * covers, so the component only lays tiles out. Nothing is calculated — the numbers
 * are `yesterday_kpis` (already computed by the backend, root Rule 8), the attention
 * rollup's check counts and the coverage list; this only formats and picks a tone.
 */

import type { StripTile } from "@/lib/kpi-strip";
import type {
  BriefAttention,
  BriefAttentionItem,
  BriefCoverageItem,
  BriefData,
} from "@/types/brief";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

export type { StripTile, StripTone } from "@/lib/kpi-strip";

/** "Friday" for "2026-09-11" — the weekday the KPI deltas compare against. */
export function weekdayOf(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });
}

function versus(delta: number | null, weekday: string): string {
  return delta === null ? weekday : `vs last ${weekday}`;
}

/** "2 high · 3 medium" — how the fired checks split by severity. */
export function severitySummary(items: BriefAttentionItem[]): string {
  const high = items.filter((item) => item.status === "error").length;
  const medium = items.filter((item) => item.status === "warn").length;
  const parts: string[] = [];
  if (high > 0) parts.push(`${high} high`);
  if (medium > 0) parts.push(`${medium} medium`);
  return parts.join(" · ");
}

/**
 * The checks tile. Absent when attention was not fetched (archive) or failed — a
 * tile that cannot say how many checks ran would be noise, not information.
 */
export function checksTile(attention: BriefAttention | null): StripTile | null {
  if (attention === null) return null;
  const fired = attention.checks_fired ?? attention.items.length;
  const failed = attention.checks_failed ?? 0;
  const detail = fired === 0 ? "none crossed a threshold" : severitySummary(attention.items);
  const sub = failed > 0 ? `${detail} · ${failed} could not run` : detail;
  const anyHigh = attention.items.some((item) => item.status === "error");
  return {
    key: "checks",
    label: "Checks fired",
    value: String(fired),
    suffix: attention.checks_run !== undefined ? `/${attention.checks_run}` : undefined,
    delta: null,
    invertDelta: false,
    sub,
    tone: fired === 0 ? "good" : anyHigh ? "bad" : "warn",
  };
}

/** "1 delayed · 1 not connected" — every non-live integration, by status. */
export function coverageSummary(coverage: BriefCoverageItem[]): string {
  const count = (status: BriefCoverageItem["status"]) =>
    coverage.filter((item) => item.status === status).length;
  const parts: string[] = [];
  const error = count("error");
  const delayed = count("delayed");
  const off = count("off");
  if (error > 0) parts.push(`${error} error`);
  if (delayed > 0) parts.push(`${delayed} delayed`);
  if (off > 0) parts.push(`${off} not connected`);
  return parts.length === 0 ? "all live" : parts.join(" · ");
}

/** The integrations tile. Absent when the payload carries no coverage at all. */
export function integrationsTile(coverage: BriefCoverageItem[]): StripTile | null {
  if (coverage.length === 0) return null;
  const live = coverage.filter((item) => item.status === "live").length;
  const anyError = coverage.some((item) => item.status === "error");
  const anyDelayed = coverage.some((item) => item.status === "delayed");
  return {
    key: "integrations",
    label: "Integrations",
    value: `${live}/${coverage.length}`,
    delta: null,
    invertDelta: false,
    sub: coverageSummary(coverage),
    tone: anyError ? "bad" : anyDelayed ? "warn" : live === coverage.length ? "good" : "neutral",
  };
}

/**
 * Every tile for the strip, in display order.
 *
 * Six on the live brief (attention fetched), five in the archive (attention is never
 * fetched there — SPEC-104). Tiles that cannot be built are left out rather than shown
 * empty, so the strip never carries a dash where a number should be.
 */
export function buildBriefStrip(
  data: BriefData,
  attention: BriefAttention | null,
): StripTile[] {
  const kpis = data.yesterday_kpis;
  const weekday = weekdayOf(data.yesterday.date);
  const tiles: StripTile[] = [
    {
      key: "revenue",
      label: "Yesterday",
      value: formatCurrency(kpis.revenue),
      delta: kpis.revenue_delta_pct,
      invertDelta: false,
      sub: versus(kpis.revenue_delta_pct, weekday),
      tone: "neutral",
    },
    {
      key: "orders",
      label: "Orders",
      value: formatNumber(kpis.orders),
      delta: kpis.orders_delta_pct,
      invertDelta: false,
      sub: versus(kpis.orders_delta_pct, weekday),
      tone: "neutral",
    },
    {
      key: "aov",
      label: "Avg order",
      value: formatCurrency(kpis.aov),
      delta: kpis.aov_delta_pct,
      invertDelta: false,
      sub: versus(kpis.aov_delta_pct, weekday),
      tone: "neutral",
    },
    {
      key: "refunds",
      label: "Refunds",
      value: formatCurrency(kpis.refunds_total),
      delta: null,
      invertDelta: true,
      sub:
        kpis.refunds_pct_of_revenue === null
          ? "of yesterday's revenue"
          : `${formatPercent(kpis.refunds_pct_of_revenue)} of revenue`,
      tone: "neutral",
    },
  ];
  const checks = checksTile(attention);
  if (checks) tiles.push(checks);
  const integrations = integrationsTile(data.coverage);
  if (integrations) tiles.push(integrations);
  return tiles;
}
