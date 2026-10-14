/**
 * Discount presentation helpers (SPEC-098). Pure + unit-tested.
 */

export type DiscountSignal = "green" | "yellow" | "red";

/** Discount as a percentage of gross (one decimal); null when gross is 0. */
export function discountShare(
  discount: number | null | undefined,
  gross: number | null | undefined,
): number | null {
  if (!gross || discount === null || discount === undefined) return null;
  if (!Number.isFinite(discount) || !Number.isFinite(gross)) return null;
  return Math.round((discount / gross) * 1000) / 10;
}

/** Traffic-light signal from red/yellow alert counts (worst wins). */
export function signalFromCounts(
  counts: { red: number; yellow: number } | null | undefined,
): DiscountSignal {
  if (!counts) return "green";
  if (counts.red > 0) return "red";
  if (counts.yellow > 0) return "yellow";
  return "green";
}
