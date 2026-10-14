import { describe, expect, it } from "vitest";

import { adaptBeat, adaptDailyPicksSnapshot, type ApiDailyPicksSnapshot } from "@/lib/adapters";
import { adaptCompetitor, gapsFiledLabel, isGapFiled, orderGapTopics } from "@/lib/competitors";
import {
  adaptInboundTopics,
  applyAddedWindow,
  inboundFilterCounts,
  INBOUND_FILTERS,
  initialInboundFilter,
  matchesInboundFilter,
  rowSourceChip,
  rowSourceLabel,
  type ApiInboundTopics,
} from "@/lib/inbound-topics";
import {
  beatLines,
  isResearchedPick,
  pickSourceLabel,
  pickRankExplanation,
  pickSourceTone,
  querySourceLabel,
} from "@/lib/spotlight";

const API: ApiInboundTopics = {
  window_end: "2026-09-22",
  summary: {
    topics: 2, queries: 3, gsc_queries: 1, derived: 1, researched: 0, competitor_gaps: 1,
    demand_total: 900, page_two_queries: 0, page_two_clicks: 0, top_query: null,
    written: 0, unwritten: 2, focus_topics: 0, angles: 1, today: "2026-09-22",
  },
  topics: [
    {
      cluster: "swimwear", category: "swimwear", persona: "P", intent: "informational",
      source: "competitor_gap", queries: 1, volume: 0, best_position: null, best_query: null,
      potential_clicks: 0, state: "none", draft_id: null, draft_status: null, published_at: null,
      focus: false, angles: 1, gap_refs: ["inheritco.com"],
      rows: [
        { id: 9, keyword: "modest swimwear guide", volume: null, position: null, potential_clicks: null,
          intent: "informational", source: "competitor_gap", source_ref: "inheritco.com", persona: "P",
          added_on: "2026-09-22", new: true },
      ],
    },
    {
      cluster: "skirts", category: "skirts", persona: "P", intent: "high", source: "search_console",
      queries: 2, volume: 900, best_position: 4, best_query: null, potential_clicks: 0, state: "none",
      draft_id: null, draft_status: null, published_at: null, focus: false, angles: 0,
      rows: [
        { id: 1, keyword: "modest skirts", volume: 900, position: 4, potential_clicks: null, intent: "high",
          source: "search_console", persona: "P" },
        { id: 2, keyword: "maxi skirt", volume: null, position: null, potential_clicks: null, intent: "high",
          source: "derived", persona: "P" },
      ],
    },
  ],
};

describe("competitor gaps on the Inbound Engine (SPEC-292)", () => {
  it("maps the source, whose gap it is, and the summary count", () => {
    const data = adaptInboundTopics(API);
    const swim = data.topics[0];
    expect(swim.source).toBe("competitor_gap");
    expect(swim.gapRefs).toEqual(["inheritco.com"]);
    expect(swim.rows[0]).toMatchObject({ source: "competitor_gap", sourceRef: "inheritco.com" });
    expect(data.summary.competitorGaps).toBe(1);
    // An older payload without the fields still adapts.
    const bare = adaptInboundTopics({
      ...API,
      summary: { ...API.summary, competitor_gaps: undefined },
      topics: [{ ...API.topics[1], gap_refs: undefined }],
    });
    expect(bare.summary.competitorGaps).toBe(0);
    expect(bare.topics[0].gapRefs).toEqual([]);
    expect(bare.topics[0].rows[1].sourceRef).toBeNull();
  });

  it("counts every filter, the gap filter included, and follows the Added window", () => {
    const data = adaptInboundTopics(API);
    const counts = inboundFilterCounts(data.topics);
    expect(counts.gaps).toBe(1);
    expect(Object.values(counts).every((n) => Number.isFinite(n))).toBe(true);
    // Inside the window a topic's gap refs and angles come from the rows still shown.
    const windowed = applyAddedWindow(data.topics, "today", "2026-09-22");
    expect(windowed.map((t) => t.cluster)).toEqual(["swimwear"]);
    expect(windowed[0]).toMatchObject({ angles: 1, gapRefs: ["inheritco.com"] });
    const older = applyAddedWindow(
      [{ ...data.topics[0], rows: [{ ...data.topics[0].rows[0], addedOn: "2026-08-01" }] }],
      "today",
      "2026-09-22",
    );
    expect(older).toEqual([]);
  });

  it("has a Competitor gaps filter that matches only gap topics", () => {
    const data = adaptInboundTopics(API);
    expect(INBOUND_FILTERS.map((f) => f.key)).toContain("gaps");
    expect(matchesInboundFilter(data.topics[0], "gaps")).toBe(true);
    expect(matchesInboundFilter(data.topics[1], "gaps")).toBe(false);
    // A gap is discovery, so the research filter shows it too.
    expect(matchesInboundFilter(data.topics[0], "research")).toBe(true);
    expect(initialInboundFilter("gaps")).toBe("gaps");
    expect(initialInboundFilter("nope")).toBe("all");
    expect(initialInboundFilter(null)).toBe("all");
  });

  it("names the source in every place a word is shown", () => {
    expect(rowSourceLabel("competitor_gap")).toBe("Competitor gap");
    expect(rowSourceChip("competitor_gap", "inheritco.com")).toBe("Gap · inheritco.com");
    expect(rowSourceChip("competitor_gap", null)).toBe("Competitor gap");
    expect(rowSourceChip("researched", null)).toBe("Research angle");
    expect(rowSourceChip("search_console", null)).toBe("Search Console");
    expect(querySourceLabel("competitor_gap")).toBe("Competitor gap");
  });
});

describe("competitor gaps on Daily Picks (SPEC-292)", () => {
  it("labels a gap pick with its competitor and treats it as discovery", () => {
    expect(pickSourceLabel("competitor_gap", "inheritco.com")).toBe("Competitor gap · inheritco.com");
    expect(pickSourceLabel("competitor_gap")).toBe("Competitor gap");
    expect(pickSourceLabel("researched")).toBe("Research");
    expect(isResearchedPick("competitor_gap")).toBe(true);
    expect(pickSourceTone("competitor_gap")).toContain("text-ai");
    const lines = pickRankExplanation(
      { demand: 0.1, margin: 0.5, catalog: 0.5, brandFit: 1, freshness: 1, performance: 1 },
      3,
      "competitor_gap",
    );
    expect(lines.some((l) => l.includes("a competitor publishes on this"))).toBe(true);
  });

  it("adapts source_ref on a pick and defaults it", () => {
    const raw: ApiDailyPicksSnapshot = {
      pick_date: "2026-09-22",
      generated_at: "2026-09-22T04:00:00Z",
      source: "scheduled",
      picks: [
        {
          cluster: "modest swimwear guide", keyword: "modest swimwear guide", intent: "informational",
          persona: "P", title: "Modest Swimwear, Explained", angle: "a", fills: "f", rationale: "r",
          featured_product_ids: [], score: 0.4, score_parts: { demand: 0, margin: 0.5, catalog: 0.5, brand_fit: 1 },
          source: "competitor_gap", source_ref: "inheritco.com",
        },
        {
          cluster: "skirts", keyword: "modest skirts", intent: "high", persona: "P", title: "Skirts for every day",
          angle: "a", fills: "f", rationale: "r", featured_product_ids: [], score: 0.8,
          score_parts: { demand: 1, margin: 0.5, catalog: 0.5, brand_fit: 1 }, source: "search_console",
        },
      ],
    };
    const snapshot = adaptDailyPicksSnapshot(raw);
    expect(snapshot.picks[0].sourceRef).toBe("inheritco.com");
    expect(snapshot.picks[1].sourceRef).toBeNull();
  });
});

describe("the competitor card's filed line (SPEC-292)", () => {
  it("maps gaps_filed and words what happened to the gap topics", () => {
    const c = adaptCompetitor({
      id: 1, name: "Inherit Co.", domain: "inheritco.com", website: "https://inheritco.com",
      status: "approved", origin: "agent", why: "ranks beside you",
      gap_topics: ["Modest Swimwear Guide", "gift guide", "abayas"], gaps_filed: ["modest swimwear guide"],
    });
    expect(c.gapsFiled).toEqual(["modest swimwear guide"]);
    expect(isGapFiled("Modest Swimwear Guide", c.gapsFiled)).toBe(true);
    expect(isGapFiled("gift guide", c.gapsFiled)).toBe(false);
    expect(gapsFiledLabel(c)).toBe("1 of 3 filed as topics");
    expect(orderGapTopics(c)).toEqual(["Modest Swimwear Guide", "gift guide", "abayas"]);
    expect(orderGapTopics({ gapTopics: ["a", "b", "c"], gapsFiled: ["c"] })).toEqual(["c", "a", "b"]);
    expect(gapsFiledLabel({ gapTopics: ["abayas"], gapsFiled: [] })).toBe(
      "none filed as topics — none match a category you sell",
    );
    expect(gapsFiledLabel({ gapTopics: [], gapsFiled: [] })).toBe("");
    expect(adaptCompetitor({ id: 2, name: "X", domain: "x.com", website: "https://x.com", status: "pending", origin: "owner", why: "" }).gapsFiled).toEqual([]);
  });
});

describe("Written to beat on a draft (SPEC-292)", () => {
  it("adapts the brief and tolerates its absence", () => {
    const beat = adaptBeat({
      url: "https://inheritco.com/blogs/journal/modest-swimwear",
      domain: "inheritco.com",
      name: "Inherit Co.",
      title: "Modest Swimwear: The Complete Guide",
      headings: ["Modest Swimwear: The Complete Guide", "Sizing and fit"],
      word_count: 1240,
      misses: ["faq", "occasions"],
      read_at: "2026-09-22T07:00:00+00:00",
    });
    expect(beat).toMatchObject({ domain: "inheritco.com", wordCount: 1240, misses: ["faq", "occasions"] });
    expect(adaptBeat(null)).toBeNull();
    expect(adaptBeat(undefined)).toBeNull();
    expect(adaptBeat({ url: "https://x" })).toBeNull(); // no domain → no panel about nothing
    expect(adaptBeat({ domain: "x.com" })).toMatchObject({ name: "x.com", headings: [], wordCount: 0, readAt: null });
  });

  it("says what the plan covered and added", () => {
    expect(beatLines({ headings: ["a", "b", "c"], wordCount: 1240, misses: ["faq", "occasions"] })).toEqual({
      covered: "Covered its 3 headings with more specific advice · 1,240 words",
      added: "Added what it misses: faq · occasions",
    });
    expect(beatLines({ headings: ["a"], wordCount: 0, misses: [] })).toEqual({
      covered: "Covered its 1 heading with more specific advice",
      added: null,
    });
    expect(beatLines({ headings: [], wordCount: 300, misses: [] }).covered).toBe(
      "Written longer and more specific than the page · 300 words",
    );
  });
});
