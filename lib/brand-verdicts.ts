/**
 * Products → Brands (SPEC-239) — the pure bits of the view: the badge class for a
 * verdict tone, the summary tiles, and the margin cell text. Every figure and every
 * verdict arrives computed (root Rule 8); this only formats and picks a class.
 */

import type { BrandRow, BrandVerdictTone, BrandVerdictsSummary } from "@/types/analysis";
import { formatNumber, formatPercent } from "@/utils/format";

const BADGE_BY_TONE: Record<BrandVerdictTone, string> = {
  bad: "bg-destructive/10 text-destructive",
  warn: "bg-warning/10 text-warning",
  good: "bg-success/10 text-success",
  neutral: "bg-muted text-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function verdictBadgeClass(tone: BrandVerdictTone): string {
  return BADGE_BY_TONE[tone];
}

export interface SummaryTile {
  key: string;
  label: string;
  value: string;
  tone: BrandVerdictTone | "plain";
}

/** Total first, then one tile per verdict in the backend's order. A zero stays a
 * tile — "0 stop" is the good news a buyer is looking for. */
export function summaryTiles(summary: BrandVerdictsSummary): SummaryTile[] {
  return [
    { key: "vendors", label: "Brands", value: formatNumber(summary.vendors), tone: "plain" },
    { key: "stop", label: "Stop buying", value: formatNumber(summary.stop), tone: "bad" },
    { key: "buy_less", label: "Buy less", value: formatNumber(summary.buyLess), tone: "warn" },
    { key: "buy_more", label: "Buy more", value: formatNumber(summary.buyMore), tone: "good" },
    { key: "hold", label: "Hold", value: formatNumber(summary.hold), tone: "neutral" },
    {
      key: "too_few_sales",
      label: "Too few sales",
      value: formatNumber(summary.tooFewSales),
      tone: "muted",
    },
  ];
}

/** "65%" over "95% costed", or "No cost data" — a margin never appears without saying
 * how much of the brand's sales it was measured on. */
export function marginCell(row: BrandRow): { text: string; sub: string | null; muted: boolean } {
  if (row.marginPct === null || row.coveragePct <= 0) {
    return { text: "No cost data", sub: null, muted: true };
  }
  return {
    text: formatPercent(row.marginPct),
    sub: `${formatPercent(row.coveragePct)} costed`,
    muted: false,
  };
}

/** "46%" or "—" when the brand has neither sales nor stock. */
export function sellThroughCell(row: BrandRow): string {
  return row.sellThrough === null ? "—" : formatPercent(row.sellThrough * 100);
}
