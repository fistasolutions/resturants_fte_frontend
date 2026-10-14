/**
 * Content Studio — commerce-signal catalog logic (SPEC-134). Pure and
 * unit-testable: no JSX, no data fetching. Owns the category tabs, the
 * `GET /social/products` query building (including the "search applies to `all`
 * only" backend rule), and the draft hydration/merge used to keep generated
 * drafts alive across product switches.
 */
import type { ProductDraft, SocialCategory } from "@/types/social";

/** The commerce-signal categories, in tab order, with their display labels. */
export const SOCIAL_CATEGORIES: { id: SocialCategory; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "all", label: "All" },
  { id: "best_seller", label: "Best-seller" },
  { id: "new_arrival", label: "New arrivals" },
  { id: "dead_stock", label: "Dead/slow stock" },
  { id: "trending", label: "Trending" },
  { id: "high_margin", label: "High-margin" },
];

/** The default category shown on first paint (the backend's default too). */
export const DEFAULT_CATEGORY: SocialCategory = "recommended";

/** Title-case a free-form token: "high_margin" → "High margin". */
function titleCase(value: string): string {
  const cleaned = value.replace(/_/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : cleaned;
}

/** Display label for a category, with a graceful fallback for unknown values. */
export function categoryLabel(category: SocialCategory | string): string {
  return SOCIAL_CATEGORIES.find((c) => c.id === category)?.label ?? titleCase(category);
}

/** Free-text search applies to the full catalog (`all`) only — backend rule. */
export function searchApplies(category: SocialCategory): boolean {
  return category === "all";
}

/**
 * Build the `GET /social/products` query string. `category` is always present;
 * `search` is included only when `searchApplies(category)` AND it is a non-empty
 * trimmed string; `limit` only when a positive number; `offset` only when a
 * positive number (page 1 omits it). Key order is deterministic (category,
 * search, limit, offset) so callers/tests get a stable string.
 */
export function buildProductsQuery(
  category: SocialCategory,
  search?: string,
  limit?: number,
  offset?: number,
): string {
  const params = new URLSearchParams({ category });
  const trimmed = search?.trim();
  if (searchApplies(category) && trimmed) params.set("search", trimmed);
  if (typeof limit === "number" && limit > 0) params.set("limit", String(limit));
  if (typeof offset === "number" && offset > 0) params.set("offset", String(offset));
  return `?${params.toString()}`;
}

/* ── Pagination (SPEC-135) — pure, unit-tested ───────────────────────────── */

/** The client page window for the product browser (matches the backend's
 * default `limit`). */
export const STUDIO_PAGE_SIZE = 12;

export interface PageInfo {
  /** 1-based current page. */
  page: number;
  /** Total number of pages, never below 1 (an empty catalog reads as 1 of 1). */
  pageCount: number;
  hasPrev: boolean;
  hasNext: boolean;
  /** 1-based index of the first item on the page (0 when empty). */
  from: number;
  /** 1-based index of the last item on the page. */
  to: number;
  total: number;
}

/**
 * Derive the pagination state from the backend's `total`/`limit`/`offset`.
 * Tolerant of a non-positive `limit` (falls back to `STUDIO_PAGE_SIZE`), a
 * negative `offset`, and a negative `total`.
 */
export function pageInfo(total: number, limit: number, offset: number): PageInfo {
  const safeLimit = limit > 0 ? limit : STUDIO_PAGE_SIZE;
  const safeTotal = Math.max(0, total);
  const safeOffset = Math.max(0, offset);
  const pageCount = Math.max(1, Math.ceil(safeTotal / safeLimit));
  const page = Math.min(pageCount, Math.floor(safeOffset / safeLimit) + 1);
  const from = safeTotal === 0 ? 0 : safeOffset + 1;
  const to = Math.min(safeOffset + safeLimit, safeTotal);
  return {
    page,
    pageCount,
    hasPrev: safeOffset > 0,
    hasNext: safeOffset + safeLimit < safeTotal,
    from,
    to,
    total: safeTotal,
  };
}

/**
 * A windowed list of page numbers centered on `page`, clamped into
 * `[1, pageCount]` and never longer than `min(max, pageCount)`. Used to render
 * the numbered pagination buttons without listing every page.
 */
export function pageWindow(page: number, pageCount: number, max = 5): number[] {
  if (pageCount <= 1) return [1];
  const span = Math.min(Math.max(1, max), pageCount);
  const clamped = Math.min(Math.max(1, page), pageCount);
  let start = Math.max(1, clamped - Math.floor(span / 2));
  const end = Math.min(pageCount, start + span - 1);
  start = Math.max(1, end - span + 1);
  const out: number[] = [];
  for (let p = start; p <= end; p += 1) out.push(p);
  return out;
}

const CHANNEL_ORDER: Record<string, number> = { instagram: 0, facebook: 1 };

/** Stable Instagram → Facebook ordering for the preview cards; never mutates. */
export function sortDrafts(drafts: ProductDraft[]): ProductDraft[] {
  return [...drafts].sort(
    (a, b) => (CHANNEL_ORDER[a.channel] ?? 99) - (CHANNEL_ORDER[b.channel] ?? 99),
  );
}

/**
 * Merge freshly generated drafts into the already-hydrated set, keyed by
 * channel: an incoming channel replaces the existing draft for that channel,
 * every other channel is preserved, and the result is stably ordered IG→FB.
 * This is what keeps a Facebook draft alive when the user regenerates Instagram
 * only. Neither input is mutated.
 */
export function mergeDraftsByChannel(
  existing: ProductDraft[],
  incoming: ProductDraft[],
): ProductDraft[] {
  const byChannel = new Map<string, ProductDraft>();
  for (const draft of existing) byChannel.set(draft.channel, draft);
  for (const draft of incoming) byChannel.set(draft.channel, draft);
  return sortDrafts([...byChannel.values()]);
}
