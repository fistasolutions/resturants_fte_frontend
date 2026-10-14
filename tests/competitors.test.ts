/** SPEC-283 — Brand Brain › Competitors: adapters, URL views, the card's words and
 * the run's progress for the toast. */
import { describe, expect, it } from "vitest";

import {
  adaptCompetitor,
  adaptCompetitorRun,
  adaptCompetitorSummary,
  axisRows,
  competitorHref,
  competitorsHref,
  competitorsInView,
  defaultView,
  elapsed,
  overlapLine,
  priceBand,
  runProgress,
  runTitle,
  searchProviderLabel,
  viewCounts,
  viewFromParam,
  type ApiCompetitor,
} from "@/lib/competitors";
import { isBrandBrainDetailPath } from "@/lib/brand-brain";

const RAW: ApiCompetitor = {
  id: 12, name: "Modest Dress Co", domain: "modestdressco.com", website: "https://modestdressco.com/",
  status: "pending", origin: "agent", why: "Ranks on page one for 41 of your searches.",
  overlap_queries: 41, overlap_page_two: 12, categories: ["dresses", "skirts"], price_min: 39, price_max: 149,
  shipping: "Free over $75", returns: "30 days, store credit", content_cadence: "2 posts / week",
  positioning: "The modest wardrobe, done simply.", where_you_win: "Refunds, not credit.",
  gap_topics: ["modest maxi dresses under $100"], pages_read: ["https://modestdressco.com/", "https://modestdressco.com/pages/returns"],
  read_error: null, fact_id: null, created_at: "2026-09-21T10:00:00Z", reviewed_at: null, last_read_at: "2026-09-21T10:02:00Z",
};

describe("adapters", () => {
  it("map the wire shape and default what the backend may omit", () => {
    const c = adaptCompetitor(RAW);
    expect(c).toMatchObject({ id: 12, status: "pending", origin: "agent", overlapQueries: 41, overlapPageTwo: 12, priceMin: 39, priceMax: 149, factId: null });
    const bare = adaptCompetitor({ id: 1, name: "X", domain: "x.com", website: "https://x.com/", status: "weird", origin: "owner" });
    expect(bare).toMatchObject({ status: "pending", origin: "owner", why: "", overlapQueries: null, categories: [], gapTopics: [], pagesRead: [], readError: null, lastReadAt: null });
    const run = adaptCompetitorRun({ id: 3, kind: "find", status: "running", steps: [{ at: "t", label: "Reading x" }] });
    expect(run).toMatchObject({ kind: "find", status: "running", found: 0, error: null });
    expect(run.steps[0]).toEqual({ at: "t", label: "Reading x", done: false });
    expect(adaptCompetitorRun({ id: 4, kind: "read", status: "nope" }).status).toBe("running");
    const s = adaptCompetitorSummary({ tracked: 5, review: 0, rejected: 1, gap_topics: 47, last_researched: "2026-09-21T10:02:00Z", running: null, web_search: false });
    expect(s).toMatchObject({ tracked: 5, gapTopics: 47, running: null, webSearch: false, webSearchProvider: null });
    expect(adaptCompetitorSummary({ ...s, tracked: 0, review: 0, rejected: 0, gap_topics: 0, last_researched: null, running: null, web_search: true, web_search_provider: "gemini" }).webSearchProvider).toBe("gemini");
    expect(searchProviderLabel("gemini")).toBe("Gemini grounding");
    expect(searchProviderLabel(null)).toBe("web search");
  });
});

describe("views are URL state", () => {
  const rows = [
    adaptCompetitor({ ...RAW, id: 1, status: "approved", overlap_queries: 3 }),
    adaptCompetitor({ ...RAW, id: 2, status: "approved", overlap_queries: null, created_at: "2026-09-20T00:00:00Z" }),
    adaptCompetitor({ ...RAW, id: 3, status: "pending" }),
    adaptCompetitor({ ...RAW, id: 4, status: "rejected" }),
    adaptCompetitor({ ...RAW, id: 5, status: "approved", overlap_queries: null, created_at: "2026-09-21T00:00:00Z" }),
  ];
  it("reads ?view=, builds hrefs and keeps the detail path recognised by the shells", () => {
    expect(viewFromParam("review")).toBe("review");
    expect(viewFromParam("rejected")).toBe("rejected");
    expect(viewFromParam(null)).toBeNull();
    expect(viewFromParam("nope")).toBe("approved");
    expect(competitorsHref()).toBe("/spotlight/brand-brain/competitors");
    expect(competitorsHref("review")).toBe("/spotlight/brand-brain/competitors?view=review");
    expect(competitorsHref("approved")).toBe("/spotlight/brand-brain/competitors?view=approved");
    expect(competitorsHref(undefined, true)).toBe("/spotlight/brand-brain/competitors?add=1");
  });
  it("opens on the review queue while finds wait and nothing is approved, else on Approved", () => {
    expect(defaultView({ approved: 0, review: 11 })).toBe("review");
    expect(defaultView({ approved: 0, review: 0 })).toBe("approved");
    expect(defaultView({ approved: 2, review: 5 })).toBe("approved");
    expect(defaultView(viewCounts(rows))).toBe("approved");
    expect(defaultView(viewCounts(rows.filter((c) => c.status !== "approved")))).toBe("review");
    expect(competitorHref(12)).toBe("/spotlight/brand-brain/competitors/12");
    expect(isBrandBrainDetailPath("/spotlight/brand-brain/competitors/12")).toBe(true);
    expect(isBrandBrainDetailPath("/spotlight/brand-brain/competitors")).toBe(false);
  });
  it("lists a view best evidence first, then newest, and counts every view", () => {
    expect(competitorsInView(rows, "approved").map((c) => c.id)).toEqual([1, 5, 2]);
    expect(competitorsInView(rows, "review").map((c) => c.id)).toEqual([3]);
    expect(competitorsInView(rows, "rejected").map((c) => c.id)).toEqual([4]);
    expect(viewCounts(rows)).toEqual({ approved: 3, review: 1, rejected: 1 });
  });
});

describe("the card's words", () => {
  const c = adaptCompetitor(RAW);
  it("prints the price band, the overlap and only the axes with something read", () => {
    expect(priceBand(c)).toBe("$39–$149");
    expect(priceBand({ priceMin: 50, priceMax: 50 })).toBe("$50");
    expect(priceBand({ priceMin: null, priceMax: 149 })).toBe("");
    expect(overlapLine(c)).toBe("overlaps 41 of your searches · 12 where you sit on page two");
    expect(overlapLine({ overlapQueries: 3, overlapPageTwo: 0 })).toBe("overlaps 3 of your searches");
    expect(overlapLine({ overlapQueries: null, overlapPageTwo: null })).toBe("overlap not measured");
    expect(axisRows(c).map((r) => r.key)).toEqual(["price", "shipping", "returns", "content"]);
    expect(axisRows({ ...c, priceMin: null, shipping: "", returns: "", contentCadence: "" })).toEqual([]);
  });
});

describe("the run, for the toast", () => {
  it("titles each state honestly and moves the bar with the steps", () => {
    const steps = [{ at: "a", label: "one" }, { at: "b", label: "two" }, { at: "c", label: "three" }];
    expect(runTitle({ kind: "find", status: "running", found: 0, error: null })).toBe("Finding competitors");
    expect(runTitle({ kind: "read", status: "running", found: 0, error: null })).toBe("Reading the site");
    expect(runTitle({ kind: "find", status: "done", found: 5, error: null })).toBe("5 competitors found");
    expect(runTitle({ kind: "find", status: "done", found: 1, error: null })).toBe("1 competitor found");
    expect(runTitle({ kind: "find", status: "done", found: 0, error: null })).toBe("No new competitors found");
    expect(runTitle({ kind: "read", status: "done", found: 1, error: null })).toBe("Profile written");
    expect(runTitle({ kind: "find", status: "failed", found: 0, error: "x" })).toBe("Finding competitors stopped");
    expect(runProgress({ kind: "find", status: "running", steps })).toBeCloseTo(3 / 9);
    expect(runProgress({ kind: "read", status: "running", steps })).toBe(0.95);
    expect(runProgress({ kind: "find", status: "done", steps })).toBe(1);
    expect(elapsed("2026-09-21T10:00:00Z", Date.parse("2026-09-21T10:01:07Z"))).toBe("1:07");
    expect(elapsed(null, 0)).toBe("");
  });
});
