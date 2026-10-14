/**
 * Pure presentation logic for Foresight → Season Radar (SPEC-170).
 * Framework-free so Vitest covers it — the repo has no component runner, so
 * anything worth asserting lives here, not in the view (root Rule 4).
 */

import type {
  SeasonAccuracy,
  SeasonCategoryRow,
  SeasonConfidence,
  SeasonOccasion,
} from "@/types/foresight";
import { formatWholeMoney } from "@/utils/format";

/** How urgent the order-by deadline is. `passed` is the one that matters most:
 * the merchant can still act on a ramp already under way, but only if the page
 * tells him plainly instead of burying it in a date. */
export type DeadlineState = "passed" | "urgent" | "soon" | "comfortable" | "none";

export function deadlineState(
  occasion: Pick<SeasonOccasion, "order_by_on" | "order_by_passed">,
  today: Date,
): DeadlineState {
  if (!occasion.order_by_on) return "none";
  if (occasion.order_by_passed) return "passed";
  const days = Math.ceil(
    (new Date(`${occasion.order_by_on}T00:00:00`).getTime() - today.getTime()) /
      86_400_000,
  );
  if (days <= 0) return "passed";
  if (days <= 14) return "urgent";
  if (days <= 45) return "soon";
  return "comfortable";
}

/** Brand red is identity-only (Rule 9) — urgency uses destructive/warning. */
export function deadlineTone(state: DeadlineState): string {
  if (state === "passed") return "text-destructive";
  if (state === "urgent") return "text-warning";
  if (state === "soon") return "text-foreground";
  return "text-muted-foreground";
}

export function deadlineMessage(
  occasion: Pick<SeasonOccasion, "order_by_on" | "order_by_passed">,
  state: DeadlineState,
): string {
  if (state === "none") return "No reorder deadline — demand is not forecast to ramp.";
  if (state === "passed") {
    return `Order-by date ${occasion.order_by_on} has passed — the ramp is already under way.`;
  }
  return `Order by ${occasion.order_by_on} to have stock on the floor before the ramp.`;
}

export function confidenceLabel(confidence: SeasonConfidence): string {
  if (confidence === "insufficient_history") return "Not enough history";
  return `${confidence[0].toUpperCase()}${confidence.slice(1)} confidence`;
}

export function confidenceTone(confidence: SeasonConfidence): string {
  if (confidence === "high") return "text-success";
  if (confidence === "medium") return "text-foreground";
  return "text-muted-foreground";
}

/** "4.6× busier" / "runs at 0.47× — quieter". A multiplier under 1 must never
 * be phrased as a lift; the merchant's decision inverts. */
export function liftPhrase(lift: number | null): string {
  if (lift === null) return "—";
  if (lift >= 1) return `${lift.toFixed(2)}× busier`;
  return `${lift.toFixed(2)}× — quieter than normal`;
}

export function formatMoney(value: number): string {
  return formatWholeMoney(value);
}

/** The occasion the hero should lead with: the soonest one that actually has a
 * forecast. An `insufficient_history` entry must never headline the page. */
export function heroOccasion(occasions: SeasonOccasion[]): SeasonOccasion | null {
  const usable = occasions
    .filter((o) => o.status !== "insufficient_history" && o.lift !== null)
    .sort((a, b) => a.days_until - b.days_until);
  return usable[0] ?? null;
}

/** Ramp points ordered furthest-out first, so the chart reads left-to-right as
 * time approaching the occasion. Null weeks are dropped. */
export function rampSeries(
  occasion: Pick<SeasonOccasion, "ramp">,
): { label: string; weeks_out: number; lift: number }[] {
  return occasion.ramp
    .filter((point): point is { weeks_out: number; lift: number } => point.lift !== null)
    .sort((a, b) => b.weeks_out - a.weeks_out)
    .map((point) => ({
      label: `${point.weeks_out}w`,
      weeks_out: point.weeks_out,
      lift: point.lift,
    }));
}

export interface LedgerHeadline {
  scored: boolean;
  hitRate: string;
  judged: number;
  meanError: string;
  pending: number;
  waitingFor: string | null;
}

export function ledgerHeadline(accuracy: SeasonAccuracy): LedgerHeadline {
  const scored = accuracy.judged > 0 && accuracy.hit_rate !== null;
  return {
    scored,
    hitRate: scored ? `${Math.round((accuracy.hit_rate ?? 0) * 100)}%` : "—",
    judged: accuracy.judged,
    meanError:
      accuracy.mean_abs_error_pct === null ? "—" : `${accuracy.mean_abs_error_pct}%`,
    pending: accuracy.pending,
    waitingFor: scored
      ? null
      : accuracy.pending > 0
        ? `${accuracy.pending} forecast${accuracy.pending === 1 ? "" : "s"} open — scored once each occasion passes.`
        : "No forecasts on record yet.",
  };
}

/** Category rows split into what to buy MORE of and what to pull BACK on.
 * Presenting them as one ranked list buries the collapses at the bottom, which
 * is exactly where the expensive mistake hides: Tees run ~10.8x for Pesach and
 * ~0.14x for Rosh Hashanah, and only one of those is obvious. */
export function splitCategories(rows: SeasonCategoryRow[]): {
  buy: SeasonCategoryRow[];
  pullBack: SeasonCategoryRow[];
} {
  return {
    buy: rows.filter((r) => r.direction === "surge"),
    pullBack: rows.filter((r) => r.direction === "collapse"),
  };
}

/** Bar width relative to the strongest mover in either direction, so a 10x
 * surge and a 0.1x collapse are both legible on one scale. */
export function categoryBarPct(row: SeasonCategoryRow, rows: SeasonCategoryRow[]): number {
  const max = Math.max(...rows.map((r) => Math.max(r.lift, 1 / Math.max(r.lift, 0.01))), 1);
  const magnitude = row.lift >= 1 ? row.lift : 1 / Math.max(row.lift, 0.01);
  return Math.max(6, Math.min(100, Math.round((magnitude / max) * 100)));
}
