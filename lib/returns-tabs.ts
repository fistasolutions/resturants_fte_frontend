/**
 * The Returns Analytics tab ids, once (SPEC-309). The page (which prefetches) and the shell
 * (which highlights the tab) each kept their own copy; the shell's lacked "fixes", so the
 * Product Fixes tab — and then Bracketing — rendered under a highlighted "Overview".
 */
export type ReturnsTab = "overview" | "by-style" | "sizing" | "categories" | "fixes" | "bracketing";

export const RETURNS_TAB_IDS: ReturnsTab[] = [
  "overview",
  "by-style",
  "sizing",
  "categories",
  "fixes",
  "bracketing",
];

export const RETURNS_TAB_LABELS: Record<ReturnsTab, string> = {
  overview: "Overview",
  "by-style": "By Style",
  sizing: "Sizing",
  categories: "Categories",
  // SPEC-187: what to change so the return does not happen again.
  fixes: "Product Fixes",
  // SPEC-309: orders that held one style in several sizes, and who does it every time.
  bracketing: "Bracketing",
};

export function normalizeReturnsTab(value: string | null | undefined): ReturnsTab {
  return RETURNS_TAB_IDS.includes(value as ReturnsTab) ? (value as ReturnsTab) : "overview";
}
