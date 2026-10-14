/**
 * Pure presentation logic for Foresight → Stockout Risk (SPEC-169).
 * Framework-free so Vitest covers it: the repo has no component runner, so
 * anything worth asserting lives here rather than inside the view (Rule 4).
 */

import type { RiskBand, StockoutAccuracy, StockoutItem } from "@/types/foresight";
import { formatWholeMoney } from "@/utils/format";

/** Semantic tokens only. Brand red is identity-only (Rule 9) and is never used
 * to signal risk — `--destructive` carries critical. */
export const BAND_COLOR: Record<RiskBand, string> = {
  critical: "var(--destructive)",
  warning: "var(--warning)",
  healthy: "var(--success)",
};

export const BAND_LABEL: Record<RiskBand, string> = {
  critical: "Critical",
  warning: "Watch",
  healthy: "Healthy",
};

export function bandTextClass(band: RiskBand): string {
  if (band === "critical") return "text-destructive";
  if (band === "warning") return "text-warning";
  return "text-success";
}

export function bandBarClass(band: RiskBand): string {
  if (band === "critical") return "bg-destructive";
  if (band === "warning") return "bg-warning";
  return "bg-success";
}

/**
 * Cover bar width, scaled against the reorder lead time rather than against the
 * largest row.
 *
 * That choice is the whole point: the question a buyer is asking is "will this
 * survive long enough for a reorder to land?", so a full bar must mean "yes,
 * comfortably" and not merely "more than the worst item on the page". Scaling
 * to the max would make a catalogue where everything is critical look healthy.
 * Capped at 100% so a well-stocked line cannot overflow the track.
 */
export function coverBarPct(daysOfCover: number, leadDays: number): number {
  if (leadDays <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((daysOfCover / leadDays) * 100)));
}

export function formatDays(days: number | null): string {
  if (days === null) return "—";
  if (days < 1) return "<1 day";
  return `${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"}`;
}

export function formatMoney(value: number): string {
  return formatWholeMoney(value);
}

/** "Ribbed Tee · M · North Store" — nulls dropped, never rendered as "null". */
export function itemLabel(item: StockoutItem): string {
  return [item.product_title, item.variant_title, item.location_name]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

export interface DonutSlice {
  band: RiskBand;
  label: string;
  count: number;
  color: string;
}

/** Donut slices, worst band first, empty bands dropped so the chart never
 * renders a zero-width wedge. */
export function donutSlices(counts: Record<RiskBand, number>): DonutSlice[] {
  const order: RiskBand[] = ["critical", "warning", "healthy"];
  return order
    .map((band) => ({
      band,
      label: BAND_LABEL[band],
      count: counts[band] ?? 0,
      color: BAND_COLOR[band],
    }))
    .filter((slice) => slice.count > 0);
}

export interface FulfilmentSummary {
  /** False until at least one prediction has been JUDGED. Before that the tab
   * must say so rather than render a fabricated 0% or 100%. */
  scored: boolean;
  hitRatePct: number;
  hitRateLabel: string;
  judged: number;
  meanError: string;
  actedUpon: number;
  pending: number;
  waitingFor: string | null;
}

/**
 * The fulfilment gauge.
 *
 * `acted_upon` is deliberately absent from the rate. The merchant reordered
 * because of the warning, so the run-out never happened — counting that as a
 * hit would inflate the score for an outcome that never occurred, and counting
 * it as a miss would punish the system for working. It is reported beside the
 * rate as its own number.
 */
export function fulfilmentSummary(accuracy: StockoutAccuracy): FulfilmentSummary {
  const scored = accuracy.judged > 0 && accuracy.hit_rate !== null;
  const pct = scored ? Math.round((accuracy.hit_rate ?? 0) * 100) : 0;
  return {
    scored,
    hitRatePct: pct,
    hitRateLabel: scored ? `${pct}%` : "—",
    judged: accuracy.judged,
    meanError:
      accuracy.mean_abs_error_days === null
        ? "—"
        : `${accuracy.mean_abs_error_days} days`,
    actedUpon: accuracy.acted_upon,
    pending: accuracy.pending,
    waitingFor: scored
      ? null
      : accuracy.pending > 0
        ? `${accuracy.pending} prediction${accuracy.pending === 1 ? "" : "s"} open${
            accuracy.next_horizon ? ` — first due ${accuracy.next_horizon}` : ""
          }`
        : "No predictions on record yet.",
  };
}

export function verdictTone(verdict: string | null): string {
  if (verdict === "hit") return "text-success";
  if (verdict === "acted_upon") return "text-primary";
  if (verdict === "miss") return "text-muted-foreground";
  return "text-muted-foreground";
}

export function verdictLabel(verdict: string | null): string {
  if (verdict === "acted_upon") return "acted on";
  return verdict ?? "—";
}
