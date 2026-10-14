/** Pure geometry for the RecoveryRing SVG donut (SPEC-100). Kept out of the
 * component so it's unit-testable (no jsdom runner). */

export function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

export function circumference(radius: number): number {
  return 2 * Math.PI * radius;
}

/** `stroke-dasharray` for an arc covering `pct`% of a circle of radius `radius`:
 * `"<filled> <gap>"`. pct is clamped to [0, 100]. */
export function dashArray(pct: number, radius: number): string {
  const c = circumference(radius);
  const filled = (clampPct(pct) / 100) * c;
  return `${filled.toFixed(2)} ${(c - filled).toFixed(2)}`;
}
