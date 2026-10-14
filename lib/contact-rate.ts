/**
 * Contact rate presentation (SPEC-096). The backend sends a ratio
 * (conversations ÷ orders); the UI shows it as "per 100 orders", which reads
 * far better than a tiny decimal. Pure + unit-tested.
 */
export function perHundred(rate: number | null | undefined): number | null {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return null;
  return Math.round(rate * 100 * 10) / 10; // one decimal
}
