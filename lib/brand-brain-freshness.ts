/** Brand Brain freshness (SPEC-108/111): turn the last-confirmed timestamp into an
 * at-a-glance trust signal. A cited knowledge base is only trustworthy while it's
 * current, so "Confirm now" earns its place by driving this — not just stamping a date.
 *
 * Pure + unit-tested (node-env Vitest); the component snapshots `nowMs` at mount so
 * render stays pure (React 19 compiler). */

/** Past this many days without a confirmation the brain is flagged stale — enough that
 * a real brand shift (new range, repositioning) would likely have happened by now. */
export const BRAND_BRAIN_STALE_DAYS = 30;

export interface BrandBrainFreshness {
  /** Whole days since the last confirmation (0 = today, clamped at ≥ 0). */
  days: number;
  /** Human phrase: "today", "yesterday", "5 days ago", "3 weeks ago", "2 months ago". */
  relative: string;
  /** True once overdue for review (≥ BRAND_BRAIN_STALE_DAYS). */
  stale: boolean;
}

function relativePhrase(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return "1 month ago";
  return `${Math.floor(days / 30)} months ago`;
}

export function brandBrainFreshness(
  lastConfirmedISO: string,
  nowMs: number,
): BrandBrainFreshness {
  const then = Date.parse(lastConfirmedISO);
  if (Number.isNaN(then)) {
    return { days: 0, relative: "recently", stale: false };
  }
  const days = Math.max(0, Math.floor((nowMs - then) / 86_400_000));
  return { days, relative: relativePhrase(days), stale: days >= BRAND_BRAIN_STALE_DAYS };
}
