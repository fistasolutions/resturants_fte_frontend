/**
 * Discounts → Decisions (SPEC-244, backend SPEC-251) — the pure bits of the view: the
 * badge class per tone, the summary tiles, and how a before → during cell reads.
 * Every figure, delta and verdict arrives computed (root Rule 8); this formats.
 */

import type { DiscountDecision, DiscountDecisionsData } from "@/types/analysis";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/utils/format";

export type DecisionTone = DiscountDecision["verdictTone"];

const BADGE_BY_TONE: Record<DecisionTone, string> = {
  bad: "bg-destructive/10 text-destructive",
  warn: "bg-warning/10 text-warning",
  good: "bg-success/10 text-success",
  neutral: "bg-muted text-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function decisionBadgeClass(tone: DecisionTone): string {
  return BADGE_BY_TONE[tone];
}

/** True when the row carries a before → during comparison worth showing. */
export function isCompared(d: DiscountDecision): boolean {
  return d.verdict !== "always_on" && d.verdict !== "too_small";
}

/** True when at least one row carries a before → during comparison. */
export function hasComparison(decisions: DiscountDecision[]): boolean {
  return decisions.some(isCompared);
}

/**
 * The one sentence shown instead of three columns of dashes when no code in the range
 * was a campaign: "No campaigns in this range — 7 codes are standing credits and 18 had
 * under 10 orders, so there is no before to compare. …"
 */
export function noComparisonLine(summary: DiscountDecisionsData["summary"]): string {
  const parts: string[] = [];
  if (summary.alwaysOn > 0) {
    parts.push(`${formatNumber(summary.alwaysOn)} ${summary.alwaysOn === 1 ? "code is a standing credit" : "codes are standing credits"}`);
  }
  if (summary.tooSmall > 0) {
    parts.push(`${formatNumber(summary.tooSmall)} had under 10 orders`);
  }
  const because = parts.length ? ` — ${parts.join(" and ")}, so there is no before to compare` : "";
  return `No campaigns in this range${because}. The comparison appears the first time a code with a start and end date runs.`;
}

export interface SummaryTile {
  key: string;
  label: string;
  value: string;
  tone: DecisionTone | "plain";
}

export function summaryTiles(summary: DiscountDecisionsData["summary"]): SummaryTile[] {
  return [
    { key: "judged", label: "Campaigns judged", value: formatNumber(summary.codesJudged), tone: "plain" },
    { key: "worked", label: "Worked", value: formatNumber(summary.worked), tone: "good" },
    { key: "cost_margin", label: "Cost margin", value: formatNumber(summary.costMargin), tone: "warn" },
    { key: "no_lift", label: "No lift", value: formatNumber(summary.noLift), tone: "bad" },
    { key: "always_on", label: "Always on", value: formatNumber(summary.alwaysOn), tone: "neutral" },
    { key: "too_small", label: "Too small", value: formatNumber(summary.tooSmall), tone: "muted" },
  ];
}

/** "$1.33M given · 87% to customers who had bought before" */
export function givenLine(summary: DiscountDecisionsData["summary"]): string {
  const share =
    summary.discountGiven > 0
      ? formatPercent((summary.discountToExisting / summary.discountGiven) * 100)
      : null;
  return share
    ? `${formatCompactCurrency(summary.discountGiven)} given · ${share} to customers who had bought before`
    : `${formatCompactCurrency(summary.discountGiven)} given`;
}

/**
 * "Aug 1 – Aug 14 · 14 d"; "No end date" for a Shopify code that never stops; "90 of 90
 * days" for a hand-typed credit in use the whole period.
 */
export function windowText(d: DiscountDecision): string {
  if (d.window.openEnded) return "No end date";
  if (d.verdict === "always_on") return `${formatNumber(d.window.days)} of ${formatNumber(d.periodDays)} days`;
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.window.start === d.window.end
    ? `${fmt(d.window.start)} · 1 d`
    : `${fmt(d.window.start)} – ${fmt(d.window.end)} · ${formatNumber(d.window.days)} d`;
}

export interface CompareCell {
  text: string;
  /** "+31%" — null when there is no comparison. */
  delta: string | null;
  tone: DecisionTone | "plain";
}

const DASH: CompareCell = { text: "—", delta: null, tone: "plain" };

function deltaTone(delta: number | null, goodWhenUp: boolean): DecisionTone | "plain" {
  if (delta === null || delta === 0) return "plain";
  return (delta > 0) === goodWhenUp ? "good" : "bad";
}

function signed(value: number, unit: string): string {
  return `${value > 0 ? "+" : ""}${formatNumber(Number(value.toFixed(1)))}${unit}`;
}

export function ordersCell(d: DiscountDecision): CompareCell {
  if (!isCompared(d)) return DASH;
  const s = d.store;
  return {
    text: `${formatNumber(s.ordersPerDayBefore)} → ${formatNumber(s.ordersPerDayDuring)}`,
    delta: s.ordersDeltaPct === null ? null : signed(s.ordersDeltaPct, "%"),
    tone: deltaTone(s.ordersDeltaPct, true),
  };
}

export function revenueCell(d: DiscountDecision): CompareCell {
  if (!isCompared(d)) return DASH;
  const s = d.store;
  return {
    text: `${formatCompactCurrency(s.revenuePerDayBefore)} → ${formatCompactCurrency(s.revenuePerDayDuring)}`,
    delta: s.revenueDeltaPct === null ? null : signed(s.revenueDeltaPct, "%"),
    tone: deltaTone(s.revenueDeltaPct, true),
  };
}

/** Margin points; "No cost data" when either window has none. */
export function marginCell(d: DiscountDecision): CompareCell {
  if (!isCompared(d)) return DASH;
  const s = d.store;
  if (s.marginPctBefore === null || s.marginPctDuring === null) {
    return { text: "No cost data", delta: null, tone: "muted" };
  }
  return {
    text: `${formatPercent(s.marginPctBefore)} → ${formatPercent(s.marginPctDuring)}`,
    delta: s.marginDeltaPts === null ? null : signed(s.marginDeltaPts, " pts"),
    tone: deltaTone(s.marginDeltaPts, true),
  };
}

/** "$9,530 · 73% to existing" */
export function givenCell(d: DiscountDecision): string {
  const share = d.existingSharePct === null ? "" : ` · ${formatPercent(d.existingSharePct)} to existing`;
  return `${formatCurrency(d.discountGiven)}${share}`;
}
