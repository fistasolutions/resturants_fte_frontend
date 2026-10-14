/** Pure formatting/threshold helpers for the Returns Intelligence dashboard
 * (SPEC-095). Kept out of components so they are unit-testable (Vitest). */
import type { Recommendation } from "@/types/returns-intel";
import { formatPercent } from "@/utils/format";

/** Rate fraction (0..1) → "12.5%". null (nothing sold) → "—". */
export function formatRate(rate: number | null): string {
  if (rate === null || rate === undefined) return "—";
  return formatPercent(rate * 100);
}

export type RateTone = "none" | "low" | "medium" | "high" | "critical";

/** Map a return-rate fraction to a severity tone used for heat coloring.
 * Thresholds are fashion-return heuristics: >30% critical, >15% high,
 * >7% medium, >0 low, else none. */
export function rateTone(rate: number | null): RateTone {
  if (rate === null || rate === undefined || rate <= 0) return "none";
  if (rate > 0.3) return "critical";
  if (rate > 0.15) return "high";
  if (rate > 0.07) return "medium";
  return "low";
}

export function recommendationLabel(rec: Recommendation): string {
  return { keep: "Keep", fix: "Fix", kill: "Kill" }[rec];
}

const SIZE_ORDER = [
  "XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL",
];

/** Canonical apparel size ordering for the sizing grid. Alpha sizes sort by
 * the size run; numeric sizes sort numerically after named ones; anything else
 * (incl. "—") sinks to the end. */
export function sizeRank(size: string): number {
  const idx = SIZE_ORDER.indexOf(size.toUpperCase());
  if (idx !== -1) return idx;
  const numeric = Number(size);
  if (!Number.isNaN(numeric)) return 100 + numeric;
  return 999;
}

/** One-line why behind the keep/fix/kill call, for the detail page. */
export function recommendationReason(rec: Recommendation): string {
  return {
    keep: "Return rate is within a healthy range — no action needed.",
    fix: "High return rate on real volume — worth fixing the fit or size chart.",
    kill: "High return rate on thin volume — consider discontinuing.",
  }[rec];
}
