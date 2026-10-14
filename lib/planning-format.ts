/**
 * Pure formatting for the planning surfaces (SPEC-218/219/220/221).
 *
 * Lives in `lib/` rather than in a component because this is the layer Vitest
 * covers — there is no jsdom runner in this repo, so logic that needs a test
 * belongs here and components stay presentational (root Rule 4).
 */

import type { NexusStatus, StaffingCell } from "@/types/planning";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** `{weekday: 5, hour: 11}` → `"Sat 11am"`. */
export function formatSlot(cell: Pick<StaffingCell, "weekday" | "hour">): string {
  const day = WEEKDAYS[cell.weekday] ?? "?";
  const h = cell.hour % 24;
  const suffix = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${day} ${hour12}${suffix}`;
}

/** A conversion FRACTION (0.412) → `"41.2%"`. The traffic API reports fractions. */
export function formatConversion(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

/** A percentage already in percent units (150.0) → `"150%"`, capped for display. */
export function formatPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "—";
  return `${pct >= 1000 ? "999+" : pct.toFixed(pct < 10 ? 1 : 0)}%`;
}

/** Progress-bar width: a real percentage, clamped to 0–100 so it cannot overflow. */
export function barWidth(pct: number | null | undefined): number {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return 0;
  return Math.max(0, Math.min(100, pct));
}

/** ISO date → `"14 Sep"`. Returns the input unchanged if it will not parse. */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const STATUS_LABELS: Record<NexusStatus, string> = {
  exceeded: "Exceeded",
  approaching: "Approaching",
  watch: "Watch",
  registered: "Registered",
  clear: "Clear",
};

export function nexusStatusLabel(status: NexusStatus): string {
  return STATUS_LABELS[status] ?? status;
}

/**
 * Token classes per status. Brand red is identity-only, so `exceeded` uses the
 * destructive token and never `--brand` (root Rule 9).
 */
export function nexusStatusClass(status: NexusStatus): string {
  switch (status) {
    case "exceeded":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "approaching":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "watch":
      return "bg-muted text-foreground border-border";
    case "registered":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

/** Discount depth chip — muted, never brand red (root Rule 9). */
export function depthLabel(pct: number): string {
  return `${pct}% off`;
}
