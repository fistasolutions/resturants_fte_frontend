/**
 * Performance Ads — pure, unit-testable display logic (SPEC-111). No JSX, no
 * data; shared by the tab bar, the persistent shell, the page route, and the
 * tab components so the tab vocabulary, the ROAS scale, and the cap-utilization
 * scale each have exactly one definition. Sibling to `lib/social.ts` /
 * `lib/spotlight.ts`.
 */

/** The five Performance Ads tabs, in bar order. `?tab=` values map 1:1 to these. */
export const ADS_TAB_IDS = [
  "overview",
  // SPEC-333: the real Meta ad account, read-only, and its audit.
  "audit",
  "campaigns",
  "creative",
  "spend-gates",
  "accountability",
] as const;

export type AdsTab = (typeof ADS_TAB_IDS)[number];

export const ADS_TAB_LABELS: Record<AdsTab, string> = {
  overview: "Overview",
  audit: "Audit",
  campaigns: "Campaigns",
  creative: "Creative",
  "spend-gates": "Spend Gates",
  accountability: "Accountability",
};

/** Coerce an untrusted `?tab=` value to a real tab; unknown → "overview". */
export function normalizeAdsTab(value: string | null | undefined): AdsTab {
  return ADS_TAB_IDS.includes(value as AdsTab)
    ? (value as AdsTab)
    : "overview";
}

export type RoasTone = "strong" | "steady" | "weak";

/**
 * Profit-aware ROAS (return on ad spend measured on real margin, not vanity
 * revenue) → tone bucket. Break-even on margin is 1.0x, so ≥2.5 strong,
 * ≥1 steady (still profitable), below 1 weak (losing money). Drives
 * status-token coloring — never brand red.
 */
export function roasTone(roas: number): RoasTone {
  if (roas >= 2.5) return "strong";
  if (roas >= 1) return "steady";
  return "weak";
}

export type CapTone = "healthy" | "nearing" | "over";

/**
 * Budget cap utilization (spent ÷ cap, 0–1+) → tone bucket for the strip and
 * per-campaign bars. <0.8 healthy, ≥0.8 nearing the cap, ≥1 at/over cap.
 */
export function capUtilizationTone(utilization: number): CapTone {
  if (utilization >= 1) return "over";
  if (utilization >= 0.8) return "nearing";
  return "healthy";
}

/** ROAS multiple for display: 3.15 → "3.2x". Formatting only (Rule 8). */
export function formatRoas(roas: number): string {
  return `${roas.toFixed(1)}x`;
}
