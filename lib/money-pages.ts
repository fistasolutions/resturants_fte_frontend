/**
 * Spotlight › Money pages — the pure half (frontend SPEC-308, backend SPEC-304).
 * Adapters, wording and the two length rules Google enforces. No fetch, no React.
 *
 * Every figure comes from the backend. This file decides how a number reads, never what
 * it is (root Rule 8) — including the one case where there is no number: a collection's
 * worth cannot be attributed, and `null` must survive all the way to the screen instead
 * of being flattened into a zero somewhere convenient.
 */

import { formatCurrency, formatNumber } from "@/utils/format";

/** Google truncates beyond roughly these. The backend clips to the same numbers. */
export const MAX_SEO_TITLE = 60;
export const MAX_META_DESCRIPTION = 155;

export interface PageSearch {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
}

export interface MoneyPageDraftSummary {
  id: number;
  createdAt: string | null;
  appliedAt: string | null;
}

export interface MoneyPage {
  kind: "product" | "collection";
  pageId: number;
  handle: string;
  title: string;
  url: string;
  position: number;
  impressions: number;
  clicks: number;
  /** Null when revenue cannot be attributed to this page (a collection). */
  revenue: number | null;
  potentialClicks: number;
  revenuePerClick: number | null;
  /** `"page"` when the worth rests on this page's own trading, `"store"` when it rests
   * on the shop's average revenue per search click. The two deserve different
   * confidence, so the screen says which one it is. */
  rateBasis: "page" | "store" | "";
  /** Money a month a properly written page would earn; null when unknowable. */
  value: number | null;
  /** True when Shopify has no search copy for it and falls back to the title. */
  unwritten: boolean;
  searches: PageSearch[];
  draft: MoneyPageDraftSummary | null;
}

export interface MoneyPagesData {
  windowEnd: string | null;
  connected: boolean;
  cached: boolean;
  drafts: number;
  /** What a search click is worth across the whole shop; null when unmeasurable. */
  storeRate: number | null;
  /** The search clicks that rate was measured over. */
  searchClicks: number;
  summary: {
    pages: number;
    value: number;
    valued: number;
    /** How many of the priced pages rest on their own trading, not the shop average. */
    ownRate: number;
    potentialClicks: number;
    unwritten: number;
  };
  pages: MoneyPage[];
}

export interface MoneyPageDraft {
  id: number;
  kind: string;
  pageId: number;
  handle: string;
  live: {
    title: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    bodyHtml: string | null;
  };
  seoTitle: string;
  metaDescription: string;
  descriptionHtml: string;
  why: string;
  missed: PageSearch[];
  appliedAt: string | null;
  createdAt: string | null;
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const maybe = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const nullableStr = (v: unknown): string | null => (typeof v === "string" ? v : null);

function adaptSearch(raw: Record<string, unknown>): PageSearch {
  return {
    query: str(raw.query),
    position: num(raw.position),
    impressions: num(raw.impressions),
    clicks: num(raw.clicks),
  };
}

export function adaptMoneyPages(raw: Record<string, unknown>): MoneyPagesData {
  const summary = (raw.summary ?? {}) as Record<string, unknown>;
  return {
    windowEnd: nullableStr(raw.window_end),
    connected: raw.connected !== false,
    cached: raw.cached === true,
    drafts: num(raw.drafts),
    storeRate: maybe(raw.store_rate),
    searchClicks: num(raw.search_clicks),
    summary: {
      pages: num(summary.pages),
      value: num(summary.value),
      valued: num(summary.valued),
      ownRate: num(summary.own_rate),
      potentialClicks: num(summary.potential_clicks),
      unwritten: num(summary.unwritten),
    },
    pages: ((raw.pages ?? []) as Record<string, unknown>[]).map((page) => {
      const draft = page.draft as Record<string, unknown> | null | undefined;
      return {
        kind: page.kind === "collection" ? "collection" : "product",
        pageId: num(page.page_id),
        handle: str(page.handle),
        title: str(page.title),
        url: str(page.url),
        position: num(page.position),
        impressions: num(page.impressions),
        clicks: num(page.clicks),
        revenue: maybe(page.revenue),
        potentialClicks: num(page.potential_clicks),
        revenuePerClick: maybe(page.revenue_per_click),
        rateBasis: page.rate_basis === "page" ? "page" : page.rate_basis === "store" ? "store" : "",
        value: maybe(page.value),
        unwritten: page.unwritten === true,
        searches: ((page.queries ?? []) as Record<string, unknown>[]).map(adaptSearch),
        draft: draft
          ? {
              id: num(draft.id),
              createdAt: nullableStr(draft.created_at),
              appliedAt: nullableStr(draft.applied_at),
            }
          : null,
      };
    }),
  };
}

export function adaptMoneyPageDraft(raw: Record<string, unknown>): MoneyPageDraft {
  const live = (raw.live ?? {}) as Record<string, unknown>;
  return {
    id: num(raw.id),
    kind: str(raw.kind),
    pageId: num(raw.page_id),
    handle: str(raw.handle),
    live: {
      title: nullableStr(live.title),
      seoTitle: nullableStr(live.seo_title),
      seoDescription: nullableStr(live.seo_description),
      bodyHtml: nullableStr(live.body_html),
    },
    seoTitle: str(raw.seo_title),
    metaDescription: str(raw.meta_description),
    descriptionHtml: str(raw.description_html),
    why: str(raw.why),
    missed: ((raw.missed ?? []) as Record<string, unknown>[]).map(adaptSearch),
    appliedAt: nullableStr(raw.applied_at),
    createdAt: nullableStr(raw.created_at),
  };
}

/** "$2,400.00 a month" — or "Worth unknown" when the shop has no measurable search
 * revenue at all. Never "$0": those are different facts and only one is true here. */
export function valueLabel(page: Pick<MoneyPage, "value" | "kind">): string {
  if (page.value === null) return "Worth unknown";
  return `${formatCurrency(page.value)} a month`;
}

/** How the worth was arrived at, in the owner's words — shown once, above the list, so
 * nobody reads a projection as a promise. */
export function rateNote(data: Pick<MoneyPagesData, "storeRate" | "searchClicks">): string {
  if (data.storeRate === null) {
    return "Your shop hasn't had enough search traffic yet to say what a search visit is worth, so these pages are ranked on the traffic they'd gain.";
  }
  return (
    `Worked out at ${formatCurrency(data.storeRate)} a search visit — what your shop has actually earned ` +
    `from search over its ${formatNumber(data.searchClicks)} search visits in the last 28 days. A page that ` +
    `sells enough on its own uses its own rate instead.`
  );
}

/** "the shop's average" / "this page's own" — how one row's figure was reached. */
export function basisLabel(page: Pick<MoneyPage, "rateBasis">): string {
  if (page.rateBasis === "page") return "at this page's own rate";
  if (page.rateBasis === "store") return "at the shop's average rate";
  return "";
}

/** "Position 12 · 3,000 impressions · 20 clicks" */
export function positionLabel(page: Pick<MoneyPage, "position" | "impressions" | "clicks">): string {
  return (
    `Position ${page.position.toFixed(1)} · ${formatNumber(page.impressions)} impressions · ` +
    `${formatNumber(page.clicks)} ${page.clicks === 1 ? "click" : "clicks"}`
  );
}

/** How a field's length sits against Google's limit: `ok` | `tight` | `over`. */
export function lengthState(value: string, limit: number): "ok" | "tight" | "over" {
  const length = value.length;
  if (length > limit) return "over";
  if (length > limit - 10) return "tight";
  return "ok";
}

/** The page's live search copy, or what Shopify falls back to when there is none —
 * labelled, so a fallback is never presented as a decision somebody made. */
export function liveTitleOf(draft: MoneyPageDraft): { text: string; fallback: boolean } {
  if (draft.live.seoTitle) return { text: draft.live.seoTitle, fallback: false };
  return { text: draft.live.title ?? "", fallback: true };
}

/** Plain text from the page's stored HTML, for a readable "before". Tag-stripping only —
 * this never renders the shop's HTML, which could carry anything. */
export function plainText(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Finding one page among four hundred (SPEC-308) ───────────────────────────
//
// Every control below works on data already in hand: the whole ranked list arrives in one
// snapshot read, so narrowing it must never cost a request. Same rule the Inbound Engine's
// Added window follows.

export type MoneyPageFilter =
  | "all"
  | "products"
  | "collections"
  | "unwritten"
  | "drafted"
  | "undrafted";

export const MONEY_PAGE_FILTERS: { key: MoneyPageFilter; label: string }[] = [
  { key: "all", label: "All pages" },
  { key: "products", label: "Products" },
  { key: "collections", label: "Collections" },
  { key: "unwritten", label: "No search copy" },
  { key: "drafted", label: "Drafted" },
  { key: "undrafted", label: "Not drafted" },
];

export type MoneyPageSort = "value" | "visits" | "impressions" | "position";

export const MONEY_PAGE_SORTS: { key: MoneyPageSort; label: string }[] = [
  { key: "value", label: "Worth" },
  { key: "visits", label: "Visits gained" },
  { key: "impressions", label: "Impressions" },
  { key: "position", label: "Position (worst first)" },
];

/** Cards per page. Twenty is about a screen and a half — enough that paging feels like
 * progress, few enough that the browser is not laying out four hundred cards. */
export const MONEY_PAGES_PER_PAGE = 20;

export function matchesMoneyFilter(page: MoneyPage, filter: MoneyPageFilter): boolean {
  switch (filter) {
    case "products":
      return page.kind === "product";
    case "collections":
      return page.kind === "collection";
    case "unwritten":
      return page.unwritten;
    case "drafted":
      return page.draft !== null;
    case "undrafted":
      return page.draft === null;
    default:
      return true;
  }
}

/** How many pages each filter would show — the owner sees the size of a slice before
 * choosing it, and a zero is shown rather than hidden: "nothing is drafted yet" is the
 * answer to a question somebody is asking. */
export function moneyFilterCounts(pages: MoneyPage[]): Record<MoneyPageFilter, number> {
  const counts = {} as Record<MoneyPageFilter, number>;
  for (const { key } of MONEY_PAGE_FILTERS) {
    counts[key] = pages.filter((page) => matchesMoneyFilter(page, key)).length;
  }
  return counts;
}

/** Title, handle, or any search the page is shown for. Searching a phrase the shop ranks
 * for is how an owner actually looks for a page — matching the title alone would miss
 * every page whose name does not contain the words shoppers type. */
export function matchesMoneySearch(page: MoneyPage, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  if (page.title.toLowerCase().includes(needle)) return true;
  if (page.handle.toLowerCase().includes(needle)) return true;
  return page.searches.some((search) => search.query.toLowerCase().includes(needle));
}

/** Never mutates the input. A page whose worth is unknown sorts after every page that has
 * one — the same rule the backend ranks by, so the default order here is the order the
 * server sent and re-sorting by Worth is a no-op rather than a reshuffle. */
export function sortMoneyPages(pages: MoneyPage[], sort: MoneyPageSort): MoneyPage[] {
  const rows = [...pages];
  switch (sort) {
    case "visits":
      return rows.sort((a, b) => b.potentialClicks - a.potentialClicks || a.handle.localeCompare(b.handle));
    case "impressions":
      return rows.sort((a, b) => b.impressions - a.impressions || a.handle.localeCompare(b.handle));
    case "position":
      // Worst first: the pages furthest from page one have the most room to move.
      return rows.sort((a, b) => b.position - a.position || a.handle.localeCompare(b.handle));
    default:
      return rows.sort(
        (a, b) =>
          Number(a.value === null) - Number(b.value === null) ||
          (b.value ?? 0) - (a.value ?? 0) ||
          b.potentialClicks - a.potentialClicks ||
          a.handle.localeCompare(b.handle),
      );
  }
}

export interface MoneyPageQuery {
  filter: MoneyPageFilter;
  search: string;
  sort: MoneyPageSort;
  page: number;
}

export const EMPTY_MONEY_QUERY: MoneyPageQuery = {
  filter: "all",
  search: "",
  sort: "value",
  page: 1,
};

/** Total number of pages for `total` rows — never below 1, so an empty result still reads
 * as "Page 1 of 1" rather than "Page 1 of 0". */
export function moneyPageCount(total: number, size: number = MONEY_PAGES_PER_PAGE): number {
  return Math.max(1, Math.ceil(total / size));
}

export interface MoneyPageView {
  /** Everything matching the filter and the search, in the chosen order. */
  matched: MoneyPage[];
  /** Just the slice on the current page. */
  visible: MoneyPage[];
  /** The page actually shown — clamped, so state can never point past the last page. */
  page: number;
  pages: number;
  total: number;
}

/** Filter, search, sort and slice in one pass, with the page clamped into range.
 *
 * Clamping here rather than in the component is deliberate: the row set shrinks whenever
 * the owner narrows, and a filter that leaves them on page 14 of a 2-page result shows an
 * empty tab and reads as a bug. The component still resets to 1 on a narrowing change —
 * this is the floor under that, for every path that forgets to.
 */
export function viewMoneyPages(
  pages: MoneyPage[],
  query: MoneyPageQuery,
  size: number = MONEY_PAGES_PER_PAGE,
): MoneyPageView {
  const matched = sortMoneyPages(
    pages.filter(
      (page) => matchesMoneyFilter(page, query.filter) && matchesMoneySearch(page, query.search),
    ),
    query.sort,
  );
  const count = moneyPageCount(matched.length, size);
  const page = Math.min(Math.max(1, query.page), count);
  const start = (page - 1) * size;
  return {
    matched,
    visible: matched.slice(start, start + size),
    page,
    pages: count,
    total: matched.length,
  };
}

/** Why the list is empty, in the owner's words — naming whichever of the two controls is
 * actually responsible, so the fix is obvious rather than a hunt. */
export function noMatchNote(query: Pick<MoneyPageQuery, "filter" | "search">): string {
  const term = query.search.trim();
  const label = MONEY_PAGE_FILTERS.find((f) => f.key === query.filter)?.label ?? "All pages";
  if (term && query.filter !== "all") {
    return `No page under “${label}” matches “${term}”. Clear the search, or switch back to All pages.`;
  }
  if (term) {
    return `Nothing matches “${term}”. Try a shorter word, or one of the searches a page ranks for.`;
  }
  return `No page falls under “${label}” right now.`;
}

/** "Page 2 of 21 · 413 pages" — where you are, and how much there is. */
export function pagerLabel(view: Pick<MoneyPageView, "page" | "pages" | "total">): string {
  const noun = view.total === 1 ? "page" : "pages";
  return `Page ${view.page} of ${view.pages} · ${formatNumber(view.total)} ${noun}`;
}
