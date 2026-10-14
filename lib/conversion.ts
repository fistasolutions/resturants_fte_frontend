/** Conversion helpers for the Store Traffic page (SPEC-103). Pure — unit-tested.
 * The backend already computes conversion; these format/guard for display. */

/** Format a fractional conversion rate (0.25) as a percent string ("25.0%").
 * Null/undefined → "—". */
export function formatConversion(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

/** Fraction → 0–100 number for bar widths etc. Null/invalid → 0. */
export function conversionPct(rate: number | null | undefined): number {
  if (rate == null || !Number.isFinite(rate)) return 0;
  return Math.min(100, Math.max(0, rate * 100));
}

/** 24h hour index → short label ("9a", "12p", "3p"). */
export function hourLabel(hour: number): string {
  const period = hour < 12 ? "a" : "p";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${period}`;
}
