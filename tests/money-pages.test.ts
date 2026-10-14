/** SPEC-308 — Money pages: the adapters, and the one thing that must never be rounded
 * into a zero. */

import { describe, expect, it } from "vitest";

import {
  EMPTY_MONEY_QUERY,
  MONEY_PAGES_PER_PAGE,
  adaptMoneyPageDraft,
  adaptMoneyPages,
  basisLabel,
  lengthState,
  liveTitleOf,
  matchesMoneyFilter,
  matchesMoneySearch,
  moneyFilterCounts,
  moneyPageCount,
  noMatchNote,
  pagerLabel,
  rateNote,
  sortMoneyPages,
  viewMoneyPages,
  plainText,
  positionLabel,
  valueLabel,
  type MoneyPage,
} from "@/lib/money-pages";

const API = {
  window_end: "2026-09-25",
  connected: true,
  cached: true,
  drafts: 1,
  store_rate: 12.9484,
  search_clicks: 12849,
  summary: {
    pages: 2,
    value: 2400,
    valued: 1,
    own_rate: 1,
    potential_clicks: 30.5,
    unwritten: 2,
  },
  pages: [
    {
      kind: "product",
      page_id: 101,
      handle: "modest-denim-skirt",
      title: "Modest denim skirt",
      url: "https://examplestore.example/products/modest-denim-skirt",
      position: 12,
      impressions: 1000,
      clicks: 20,
      revenue: 4000,
      potential_clicks: 12,
      revenue_per_click: 200,
      rate_basis: "page",
      value: 2400,
      unwritten: true,
      queries: [{ query: "modest denim skirt", position: 12, impressions: 900, clicks: 18 }],
      draft: { id: 7, created_at: "2026-09-25T10:00:00Z", applied_at: null },
    },
    {
      kind: "collection",
      page_id: 201,
      handle: "skirts",
      title: "Skirts",
      url: "https://examplestore.example/collections/skirts",
      position: 14,
      impressions: 4000,
      clicks: 90,
      revenue: null,
      potential_clicks: 18.5,
      revenue_per_click: null,
      rate_basis: "",
      value: null,
      unwritten: true,
      queries: [],
      draft: null,
    },
  ],
};

describe("adaptMoneyPages", () => {
  it("maps the payload and keeps an unknowable value null", () => {
    const data = adaptMoneyPages(API);
    expect(data.pages[0].value).toBe(2400);
    expect(data.pages[0].draft).toEqual({
      id: 7,
      createdAt: "2026-09-25T10:00:00Z",
      appliedAt: null,
    });
    // The whole point: a collection's worth is unknown, not zero.
    expect(data.pages[1].value).toBeNull();
    expect(data.pages[1].revenue).toBeNull();
    expect(data.pages[1].revenuePerClick).toBeNull();
    expect(data.pages[1].draft).toBeNull();
  });

  it("survives a payload with nothing in it", () => {
    const empty = adaptMoneyPages({});
    expect(empty.pages).toEqual([]);
    expect(empty.summary).toEqual({
      pages: 0,
      value: 0,
      valued: 0,
      ownRate: 0,
      potentialClicks: 0,
      unwritten: 0,
    });
    expect(empty.storeRate).toBeNull();
    // Absent means connected — a missing flag must not render "not connected".
    expect(empty.connected).toBe(true);
    expect(adaptMoneyPages({ connected: false }).connected).toBe(false);
  });
});

describe("the wording", () => {
  it("never prices a page it cannot price", () => {
    const data = adaptMoneyPages(API);
    expect(valueLabel(data.pages[0])).toBe("$2,400.00 a month");
    expect(valueLabel(data.pages[1])).toBe("Worth unknown");
  });

  it("says where the money figure came from, so a projection never reads as a promise", () => {
    const data = adaptMoneyPages(API);
    expect(basisLabel(data.pages[0])).toBe("at this page's own rate");
    expect(basisLabel({ rateBasis: "store" })).toBe("at the shop's average rate");
    expect(basisLabel(data.pages[1])).toBe("");

    expect(rateNote(data)).toBe(
      "Worked out at $12.95 a search visit — what your shop has actually earned from search over its 12,849 search visits in the last 28 days. A page that sells enough on its own uses its own rate instead.",
    );
    expect(rateNote({ storeRate: null, searchClicks: 0 })).toContain(
      "hasn't had enough search traffic yet",
    );
  });

  it("reads a page's standing out loud", () => {
    expect(positionLabel({ position: 12, impressions: 3000, clicks: 20 })).toBe(
      "Position 12.0 · 3,000 impressions · 20 clicks",
    );
    expect(positionLabel({ position: 4.5, impressions: 60, clicks: 1 })).toBe(
      "Position 4.5 · 60 impressions · 1 click",
    );
  });

  it("warns before Google truncates, not after", () => {
    expect(lengthState("a".repeat(40), 60)).toBe("ok");
    expect(lengthState("a".repeat(51), 60)).toBe("tight");
    expect(lengthState("a".repeat(61), 60)).toBe("over");
  });
});

describe("the before", () => {
  it("says when the live title is only Shopify's fallback", () => {
    const withOverride = adaptMoneyPageDraft({
      seo_title: "New",
      meta_description: "New",
      description_html: "<p>New</p>",
      why: "because",
      live: { title: "Skirt", seo_title: "Skirt | Example Store" },
    });
    expect(liveTitleOf(withOverride)).toEqual({ text: "Skirt | Example Store", fallback: false });

    const withoutOverride = adaptMoneyPageDraft({
      seo_title: "New",
      meta_description: "New",
      description_html: "<p>New</p>",
      why: "because",
      live: { title: "Skirt", seo_title: null },
    });
    expect(liveTitleOf(withoutOverride)).toEqual({ text: "Skirt", fallback: true });
  });

  it("reads stored HTML as text without ever rendering it", () => {
    expect(plainText("<p>A <strong>linen</strong> dress &amp; more.</p>")).toBe(
      "A linen dress & more.",
    );
    expect(plainText('<script>alert("x")</script>')).toBe('alert("x")');
    expect(plainText(null)).toBe("");
  });
});


// ── Finding one page among four hundred (SPEC-308) ───────────────────────────

function page(over: Partial<MoneyPage> = {}): MoneyPage {
  return {
    kind: "product",
    pageId: 1,
    handle: "a-skirt",
    title: "A skirt",
    url: "https://x/products/a-skirt",
    position: 9,
    impressions: 100,
    clicks: 2,
    revenue: 0,
    potentialClicks: 10,
    revenuePerClick: 1,
    rateBasis: "store",
    value: 10,
    unwritten: true,
    searches: [],
    draft: null,
    ...over,
  };
}

describe("filtering", () => {
  const rows = [
    page({ pageId: 1, kind: "product", unwritten: true, draft: null }),
    page({ pageId: 2, kind: "collection", unwritten: false, draft: null }),
    page({ pageId: 3, kind: "product", unwritten: false, draft: { id: 9, createdAt: null, appliedAt: null } }),
  ];

  it("splits the list the way an owner thinks about it", () => {
    expect(rows.filter((r) => matchesMoneyFilter(r, "products")).map((r) => r.pageId)).toEqual([1, 3]);
    expect(rows.filter((r) => matchesMoneyFilter(r, "collections")).map((r) => r.pageId)).toEqual([2]);
    expect(rows.filter((r) => matchesMoneyFilter(r, "unwritten")).map((r) => r.pageId)).toEqual([1]);
    expect(rows.filter((r) => matchesMoneyFilter(r, "drafted")).map((r) => r.pageId)).toEqual([3]);
    expect(rows.filter((r) => matchesMoneyFilter(r, "undrafted")).map((r) => r.pageId)).toEqual([1, 2]);
    expect(rows.filter((r) => matchesMoneyFilter(r, "all"))).toHaveLength(3);
  });

  it("counts every slice, including the empty ones", () => {
    const counts = moneyFilterCounts(rows);
    expect(counts).toEqual({ all: 3, products: 2, collections: 1, unwritten: 1, drafted: 1, undrafted: 2 });
    // A zero is an answer to a question, so it is counted rather than omitted.
    expect(moneyFilterCounts([]).drafted).toBe(0);
  });

  it("searches the page AND the searches it ranks for", () => {
    const row = page({
      title: "Pleated skirt",
      handle: "pleated-skirt-black",
      searches: [{ query: "black midi skirt", position: 9, impressions: 10, clicks: 0 }],
    });
    expect(matchesMoneySearch(row, "pleated")).toBe(true);
    expect(matchesMoneySearch(row, "SKIRT-BLACK")).toBe(true);
    // The point of searching the queries too: this word is in neither the title nor handle.
    expect(matchesMoneySearch(row, "midi")).toBe(true);
    expect(matchesMoneySearch(row, "denim")).toBe(false);
    expect(matchesMoneySearch(row, "   ")).toBe(true);
  });
});

describe("sorting", () => {
  const rows = [
    page({ pageId: 1, handle: "b", value: 100, potentialClicks: 5, impressions: 900, position: 5 }),
    page({ pageId: 2, handle: "a", value: null, potentialClicks: 900, impressions: 10, position: 28 }),
    page({ pageId: 3, handle: "c", value: 300, potentialClicks: 50, impressions: 100, position: 12 }),
  ];

  it("puts a page whose worth is unknown after every page that has one", () => {
    expect(sortMoneyPages(rows, "value").map((r) => r.pageId)).toEqual([3, 1, 2]);
  });

  it("orders by the thing you picked", () => {
    expect(sortMoneyPages(rows, "visits").map((r) => r.pageId)).toEqual([2, 3, 1]);
    expect(sortMoneyPages(rows, "impressions").map((r) => r.pageId)).toEqual([1, 3, 2]);
    // Worst first — the pages furthest from page one have the most room to move.
    expect(sortMoneyPages(rows, "position").map((r) => r.pageId)).toEqual([2, 3, 1]);
  });

  it("never mutates what it was given", () => {
    const before = rows.map((r) => r.pageId);
    sortMoneyPages(rows, "visits");
    expect(rows.map((r) => r.pageId)).toEqual(before);
  });
});

describe("paging", () => {
  const many = Array.from({ length: 413 }, (_, i) =>
    page({ pageId: i + 1, handle: `p${String(i).padStart(3, "0")}`, value: 1000 - i }),
  );

  it("shows twenty at a time and says where you are", () => {
    const first = viewMoneyPages(many, EMPTY_MONEY_QUERY);
    expect(first.visible).toHaveLength(MONEY_PAGES_PER_PAGE);
    expect(first.total).toBe(413);
    expect(first.pages).toBe(21);
    expect(pagerLabel(first)).toBe("Page 1 of 21 · 413 pages");

    const second = viewMoneyPages(many, { ...EMPTY_MONEY_QUERY, page: 2 });
    expect(second.visible[0].pageId).toBe(21);

    // The last page is a short one, not an empty one.
    const last = viewMoneyPages(many, { ...EMPTY_MONEY_QUERY, page: 21 });
    expect(last.visible).toHaveLength(13);
  });

  it("clamps a page that points past the end", () => {
    // The row set shrinks whenever the owner narrows; landing on page 14 of a 2-page
    // result shows an empty tab and reads as a bug.
    const view = viewMoneyPages(many.slice(0, 5), { ...EMPTY_MONEY_QUERY, page: 14 });
    expect(view.page).toBe(1);
    expect(view.visible).toHaveLength(5);
    expect(viewMoneyPages(many, { ...EMPTY_MONEY_QUERY, page: 0 }).page).toBe(1);
  });

  it("still reads as Page 1 of 1 when nothing matches", () => {
    const view = viewMoneyPages(many, { ...EMPTY_MONEY_QUERY, search: "nothing-like-this" });
    expect(view.total).toBe(0);
    expect(view.pages).toBe(1);
    expect(moneyPageCount(0)).toBe(1);
  });

  it("filters, searches and sorts before it pages", () => {
    const rows = [
      page({ pageId: 1, kind: "collection", title: "Denim skirts", value: 10 }),
      page({ pageId: 2, kind: "product", title: "Denim skirt", value: 500 }),
      page({ pageId: 3, kind: "product", title: "Linen dress", value: 900 }),
    ];
    const view = viewMoneyPages(rows, {
      filter: "products",
      search: "denim",
      sort: "value",
      page: 1,
    });
    expect(view.matched.map((r) => r.pageId)).toEqual([2]);
  });
});

describe("why the list is empty", () => {
  it("names whichever control is actually responsible", () => {
    expect(noMatchNote({ filter: "products", search: "denim" })).toContain("under “Products”");
    expect(noMatchNote({ filter: "all", search: "denim" })).toContain("Try a shorter word");
    expect(noMatchNote({ filter: "drafted", search: "" })).toBe(
      "No page falls under “Drafted” right now.",
    );
  });
});
