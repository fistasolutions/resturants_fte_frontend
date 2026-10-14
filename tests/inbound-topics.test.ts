/** SPEC-277 — the Inbound Engine as topics: adapter, segments, filters, sort, words.
 *  SPEC-279 — research angles fold in, every search is dated, the Added window. */
import { describe, expect, it } from "vitest";

import {
  adaptInboundTopics,
  addedCounts,
  applyAddedWindow,
  filterTopics,
  formatAddedOn,
  formatClicks,
  inboundFilterCounts,
  rankLabel,
  rowInWindow,
  rowSourceLabel,
  sortTopics,
  topicAction,
  topicPersonas,
  topicWriteRow,
  type ApiInboundTopics,
} from "@/lib/inbound-topics";

const API: ApiInboundTopics = {
  window_end: "2026-09-18",
  summary: { topics: 3, queries: 6, gsc_queries: 3, derived: 1, researched: 2, demand_total: 22605, page_two_queries: 2, page_two_clicks: 785.3, top_query: { query: "black maxi skirt", position: 11.6, potential_clicks: 601.3 }, written: 1, unwritten: 2, focus_topics: 1, angles: 2, new_queries: 2, new_topics: 2, rebuilt_at: "2026-09-18T04:00:00+00:00", window_start: "2026-08-22", scout_last_added_on: "2026-09-18", scout_last_added_count: 1, today: "2026-09-18" },
  topics: [
    { cluster: "skirts", category: "skirts", persona: "The Modern Modest Woman", intent: "high", source: "search_console", queries: 4, volume: 20205, best_position: 11.6, best_query: "black maxi skirt", potential_clicks: 601.3, state: "none", draft_id: null, draft_status: null, published_at: null, focus: true, angles: 1, newest_on: "2026-09-18", new_count: 1,
      rows: [
        { id: 1, keyword: "black maxi skirt", volume: 6536, position: 11.6, potential_clicks: 601.3, intent: "high", source: "search_console", persona: "The Modern Modest Woman", added_on: "2026-09-17", new: false },
        { id: 2, keyword: "denim skirt", volume: 13669, position: 3.2, potential_clicks: null, intent: "high", source: "search_console", persona: "The Modern Modest Woman", added_on: "2026-09-03", new: false },
        { id: 6, keyword: "corduroy modest skirts for winter", volume: null, position: null, potential_clicks: null, intent: "seasonal", source: "researched", persona: "The Modern Modest Woman", added_on: "2026-09-18", new: true },
        { id: 3, keyword: "are skirts modest enough", volume: null, position: null, potential_clicks: null, intent: "informational", source: "derived", persona: "The Service-Led Shopper", added_on: "2026-08-05", new: false },
      ] },
    { cluster: "dresses", category: "dresses", persona: "The Full-Wardrobe Shopper", intent: "high", source: "search_console", queries: 1, volume: 2400, best_position: 12.3, best_query: "modest dresses for women", potential_clicks: 184, state: "draft", draft_id: 22, draft_status: "in_review", published_at: null, focus: false, angles: 0, newest_on: "2026-09-18", new_count: 1,
      rows: [{ id: 4, keyword: "modest dresses for women", volume: 2400, position: 12.3, potential_clicks: 184, intent: "high", source: "search_console", persona: "The Full-Wardrobe Shopper", added_on: "2026-09-18", new: true }] },
    { cluster: "tops", category: "tops", persona: "The Full-Wardrobe Shopper", intent: "informational", source: "researched", queries: 1, volume: 0, best_position: null, best_query: null, potential_clicks: 0, state: "published", draft_id: 9, draft_status: "published", published_at: "2026-09-16T10:00:00+00:00", focus: false, angles: 1, newest_on: "2026-08-12", new_count: 0,
      rows: [{ id: 5, keyword: "best layering tops", volume: null, position: null, potential_clicks: null, intent: "informational", source: "researched", persona: "The Full-Wardrobe Shopper", added_on: "2026-08-12", new: false }] },
  ],
};

describe("adapter", () => {
  it("maps the wire shape and tolerates unknown states and sources", () => {
    const data = adaptInboundTopics(API);
    expect(data.windowEnd).toBe("2026-09-18");
    expect(data.summary.topQuery?.potentialClicks).toBe(601.3);
    expect(data.topics[0]).toMatchObject({ cluster: "skirts", source: "search_console", state: "none", focus: true, bestPosition: 11.6 });
    expect(data.topics[0].rows[1]).toMatchObject({ keyword: "denim skirt", potentialClicks: null });
    const odd = adaptInboundTopics({ ...API, topics: [{ ...API.topics[0], state: "weird", source: "odd" }] });
    expect(odd.topics[0]).toMatchObject({ state: "none", source: "derived" });
  });

  it("reads the SPEC-279 fields and defaults them when a payload lacks them", () => {
    const data = adaptInboundTopics(API);
    expect(data.summary).toMatchObject({ angles: 2, newQueries: 2, newTopics: 2, rebuiltAt: "2026-09-18T04:00:00+00:00", windowStart: "2026-08-22", scoutLastAddedOn: "2026-09-18", scoutLastAddedCount: 1, today: "2026-09-18" });
    expect(data.topics[0]).toMatchObject({ angles: 1, newestOn: "2026-09-18", newCount: 1 });
    expect(data.topics[0].rows[2]).toMatchObject({ keyword: "corduroy modest skirts for winter", addedOn: "2026-09-18", isNew: true });
    const bare = adaptInboundTopics({ ...API, summary: { ...API.summary, angles: undefined, rebuilt_at: undefined, today: undefined }, topics: [{ ...API.topics[1], angles: undefined, newest_on: undefined, new_count: undefined, rows: [{ ...API.topics[1].rows[0], added_on: undefined, new: undefined, id: null }] }] });
    expect(bare.summary).toMatchObject({ angles: 0, rebuiltAt: null, today: null });
    expect(bare.topics[0]).toMatchObject({ angles: 0, newestOn: null, newCount: 0 });
    expect(bare.topics[0].rows[0]).toMatchObject({ id: null, addedOn: null, isNew: false });
  });
});

describe("the Added window (SPEC-279)", () => {
  const topics = adaptInboundTopics(API).topics;
  const today = "2026-09-18";

  it("places a row by its age against today, and an undated row only under All time", () => {
    const row = topics[0].rows[0]; // added Sep 17
    expect(rowInWindow(row, "today", today)).toBe(false);
    expect(rowInWindow(row, "7", today)).toBe(true);
    expect(rowInWindow(row, "30", today)).toBe(true);
    expect(rowInWindow(row, "all", today)).toBe(true);
    expect(rowInWindow({ ...row, addedOn: "2026-09-18" }, "today", today)).toBe(true);
    expect(rowInWindow({ ...row, addedOn: null }, "30", today)).toBe(false);
    expect(rowInWindow({ ...row, addedOn: null }, "all", today)).toBe(true);
    expect(rowInWindow(row, "30", null)).toBe(false);
  });

  it("counts searches per window, never the synthetic Search Console line", () => {
    expect(addedCounts(topics, today)).toEqual({ today: 2, "7": 3, "30": 4, all: 6 });
    const withSynthetic = [{ ...topics[0], rows: [...topics[0].rows, { ...topics[0].rows[0], id: null, keyword: "black skirt", addedOn: today }] }];
    expect(addedCounts(withSynthetic, today).today).toBe(1);
  });

  it("windows a topic's rows and counts, and drops a topic with nothing in the window", () => {
    const thirty = applyAddedWindow(topics, "30", today);
    expect(thirty.map((t) => t.cluster)).toEqual(["skirts", "dresses"]); // tops (Aug 12) leaves
    expect(thirty[0]).toMatchObject({ queries: 3, angles: 1, hiddenRows: 1 });
    expect(thirty[0].rows.map((r) => r.keyword)).not.toContain("are skirts modest enough");
    const todayOnly = applyAddedWindow(topics, "today", today);
    expect(todayOnly.map((t) => [t.cluster, t.queries])).toEqual([["skirts", 1], ["dresses", 1]]);
    const all = applyAddedWindow(topics, "all", today);
    expect(all).toHaveLength(3);
    expect(all[0]).toMatchObject({ queries: 4, angles: 1, hiddenRows: 0 });
  });

  it("names a day and a source the way a row reads them", () => {
    expect(formatAddedOn("2026-09-12")).toBe("Sep 12");
    expect(formatAddedOn(null)).toBe("");
    expect(formatAddedOn("nonsense")).toBe("");
    expect(rowSourceLabel("search_console")).toBe("Search Console");
    expect(rowSourceLabel("researched")).toBe("Keyword Scout");
    expect(rowSourceLabel("derived")).toBe("derived from your catalog");
  });
});

describe("segments, filters and sort", () => {
  const topics = adaptInboundTopics(API).topics;

  it("counts every segment and narrows by it", () => {
    expect(inboundFilterCounts(topics)).toEqual({ all: 3, p2: 2, gsc: 2, unwritten: 1, research: 2, gaps: 0, focus: 1 });
    expect(filterTopics(topics, { filter: "p2", intent: null, persona: null, text: "" }).map((t) => t.cluster)).toEqual(["skirts", "dresses"]);
    expect(filterTopics(topics, { filter: "unwritten", intent: null, persona: null, text: "" }).map((t) => t.cluster)).toEqual(["skirts"]);
    expect(filterTopics(topics, { filter: "all", intent: "informational", persona: null, text: "" }).map((t) => t.cluster)).toEqual(["skirts", "tops"]);
    expect(filterTopics(topics, { filter: "research", intent: null, persona: null, text: "" }).map((t) => t.cluster)).toEqual(["skirts", "tops"]);
    expect(filterTopics(topics, { filter: "all", intent: null, persona: "The Service-Led Shopper", text: "" }).map((t) => t.cluster)).toEqual(["skirts"]);
    expect(filterTopics(topics, { filter: "all", intent: null, persona: null, text: "maxi" }).map((t) => t.cluster)).toEqual(["skirts"]);
  });

  it("sorts by opportunity, demand, name, newest and not-written-first", () => {
    expect(sortTopics(topics, "opportunity").map((t) => t.cluster)).toEqual(["skirts", "dresses", "tops"]);
    expect(sortTopics(topics, "demand").map((t) => t.cluster)).toEqual(["skirts", "dresses", "tops"]);
    expect(sortTopics(topics, "name").map((t) => t.cluster)).toEqual(["dresses", "skirts", "tops"]);
    expect(sortTopics([...topics].reverse(), "newest").map((t) => t.cluster)).toEqual(["skirts", "dresses", "tops"]); // same day → more new, then opportunity
    expect(sortTopics([...topics].reverse(), "unwritten")[0].cluster).toBe("skirts");
    expect(topicPersonas(topics)).toEqual(["The Full-Wardrobe Shopper", "The Modern Modest Woman", "The Service-Led Shopper"]);
  });
});

describe("words", () => {
  const topics = adaptInboundTopics(API).topics;

  it("labels a rank by its page", () => {
    expect(rankLabel(11.6)).toEqual({ text: "#11.6 · page 2", tone: "p2" });
    expect(rankLabel(3.2)).toEqual({ text: "#3.2 · page 1", tone: "p1" });
    expect(rankLabel(28)).toEqual({ text: "#28 · page 3", tone: "far" });
    expect(rankLabel(null)).toEqual({ text: "not ranking", tone: "none" });
  });

  it("rounds clicks to something a person can hold", () => {
    expect(formatClicks(0)).toBe("—");
    expect(formatClicks(6.4)).toBe("~6");
    expect(formatClicks(47)).toBe("~45");
    expect(formatClicks(601.3)).toBe("~600");
    expect(formatClicks(4083)).toBe("~4,100");
  });

  it("gives the brand home no action and keeps it last and out of Not written", () => {
    const brand = { ...topics[0], kind: "brand" as const, cluster: "searches for the store by name", state: "none" as const, potentialClicks: 0, volume: 99999 };
    expect(topicAction(brand)).toEqual({ kind: "none", label: "" });
    for (const s of ["opportunity", "demand", "name", "newest", "unwritten"] as const) expect(sortTopics([brand, ...topics], s).at(-1)?.kind).toBe("brand");
    expect(inboundFilterCounts([brand, ...topics]).unwritten).toBe(1);
    const data = adaptInboundTopics({ ...API, summary: { ...API.summary, topic_demand: 15644, brand_demand: 48904 }, topics: [{ ...API.topics[0], kind: "other" }] });
    expect(data.summary).toMatchObject({ topicDemand: 15644, brandDemand: 48904 });
    expect(data.topics[0].kind).toBe("other");
    expect(adaptInboundTopics(API).topics[0].kind).toBe("topic");
  });

  it("gives each topic one action and the query to write against", () => {
    expect(topicAction(topics[0])).toEqual({ kind: "write", label: "Write this" });
    expect(topicAction(topics[1])).toEqual({ kind: "open", label: "Open draft" });
    expect(topicAction(topics[2])).toEqual({ kind: "reach", label: "See reach" });
    expect(topicWriteRow(topics[0])?.keyword).toBe("black maxi skirt"); // the page-two winner, not the biggest
    expect(topicWriteRow({ ...topics[0], bestQuery: null })?.keyword).toBe("denim skirt");
    expect(topicWriteRow({ ...topics[0], rows: [] })).toBeNull();
    // The page-two winner the bank never held is the Search Console line (id null) — Write this targets it by keyword.
    const synthetic = { ...topics[0].rows[0], id: null, keyword: "black skirt" };
    expect(topicWriteRow({ ...topics[0], bestQuery: "black skirt", rows: [topics[0].rows[1], synthetic] })).toMatchObject({ id: null, keyword: "black skirt" });
  });
});
