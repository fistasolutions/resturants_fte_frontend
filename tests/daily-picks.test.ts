import { describe, expect, it } from "vitest";

import {
  adaptDailyPicksHistoryEntry,
  adaptDailyPicksSnapshot,
  type ApiDailyPicksHistoryEntry,
  type ApiDailyPicksSnapshot,
} from "@/lib/adapters";
import {
  DAILY_PICK_SCORE_PARTS,
  SPOTLIGHT_TAB_IDS,
  formatPickScore,
  normalizeSpotlightTab,
} from "@/lib/spotlight";

// Pure, node-safe: adapters/helpers never import the server-only service seam.

describe("formatPickScore", () => {
  it("renders a 0-1 score as a whole percent", () => {
    expect(formatPickScore(0.8875)).toBe(89);
    expect(formatPickScore(0)).toBe(0);
    expect(formatPickScore(1)).toBe(100);
  });

  it("clamps out-of-range values and treats non-finite as 0", () => {
    expect(formatPickScore(1.4)).toBe(100);
    expect(formatPickScore(-0.2)).toBe(0);
    // Non-finite is an unknown score, not a max — it renders as 0, never NaN.
    expect(formatPickScore(Number.NaN)).toBe(0);
    expect(formatPickScore(Infinity)).toBe(0);
  });
});

describe("Daily Picks tab registration", () => {
  it("registers daily-picks as a real tab", () => {
    expect(SPOTLIGHT_TAB_IDS).toContain("daily-picks");
    expect(normalizeSpotlightTab("daily-picks")).toBe("daily-picks");
  });
});

describe("DAILY_PICK_SCORE_PARTS", () => {
  it("covers the five backend score components in order (striking drawn only when measured)", () => {
    expect(DAILY_PICK_SCORE_PARTS.map((p) => p.key)).toEqual([
      "demand",
      "striking",
      "margin",
      "catalog",
      "brandFit",
    ]);
  });
});

describe("adaptDailyPicksSnapshot", () => {
  const RAW: ApiDailyPicksSnapshot = {
    pick_date: "2026-08-22",
    generated_at: "2026-08-22T05:00:00Z",
    source: "scheduled",
    picks: [
      {
        cluster: "skirts",
        keyword: "modest skirts for work",
        intent: "high",
        persona: "The Full-Wardrobe Shopper",
        title: "10 Modest Skirts for the Office",
        angle: "Workwear that covers.",
        fills: "Lengths, fabrics, styling.",
        rationale: "High intent, deep catalog.",
        featured_product_ids: [1, 2],
        score: 0.8875,
        score_parts: { demand: 1, margin: 0.55, catalog: 1, brand_fit: 1 },
      },
    ],
  };

  it("maps snake_case to camelCase and preserves the backend score", () => {
    const out = adaptDailyPicksSnapshot(RAW);
    expect(out.pickDate).toBe("2026-08-22");
    expect(out.generatedAt).toBe("2026-08-22T05:00:00Z");
    expect(out.source).toBe("scheduled");
    expect(out.picks).toHaveLength(1);
    const pick = out.picks[0];
    expect(pick.keyword).toBe("modest skirts for work");
    expect(pick.featuredProductIds).toEqual([1, 2]);
    expect(pick.score).toBe(0.8875);
    expect(pick.scoreParts).toEqual({
      demand: 1,
      margin: 0.55,
      catalog: 1,
      brandFit: 1,
      // SPEC-159/161 multipliers — absent from this fixture, so they default to
      // 1 (neutral). Defaulting to 0 would zero out every historical pick.
      freshness: 1,
      performance: 1,
    });
  });

  it("defaults draft link fields to null when absent", () => {
    const pick = adaptDailyPicksSnapshot(RAW).picks[0];
    expect(pick.draftId).toBeNull();
    expect(pick.draftStatus).toBeNull();
  });

  it("maps an attached draft link", () => {
    const withDraft = adaptDailyPicksSnapshot({
      ...RAW,
      picks: [{ ...RAW.picks[0], draft_id: 42, draft_status: "in_review" }],
    });
    expect(withDraft.picks[0].draftId).toBe(42);
    expect(withDraft.picks[0].draftStatus).toBe("in_review");
  });

  it("coerces an unknown source to 'scheduled' and tolerates missing fields", () => {
    const out = adaptDailyPicksSnapshot({
      pick_date: "2026-08-21",
      generated_at: null,
      source: "something-else",
      picks: [],
    });
    expect(out.source).toBe("scheduled");
    expect(out.generatedAt).toBeNull();
    expect(out.picks).toEqual([]);
  });

  it("passes 'manual' through", () => {
    expect(adaptDailyPicksSnapshot({ ...RAW, source: "manual" }).source).toBe(
      "manual",
    );
  });
});

describe("adaptDailyPicksHistoryEntry", () => {
  it("maps a history row", () => {
    const raw: ApiDailyPicksHistoryEntry = {
      pick_date: "2026-08-20",
      generated_at: "2026-08-20T05:00:00Z",
    };
    expect(adaptDailyPicksHistoryEntry(raw)).toEqual({
      pickDate: "2026-08-20",
      generatedAt: "2026-08-20T05:00:00Z",
    });
  });
});

describe("striking distance on a pick (SPEC-265; backend SPEC-264)", () => {
  const base = {
    cluster: "skirts",
    keyword: "modest skirts",
    intent: "high",
    persona: "p",
    title: "t",
    angle: "a",
    fills: "f",
    rationale: "r",
    featured_product_ids: [],
    score: 0.5,
  };

  it("keeps striking absent on a legacy snapshot and null evidence", () => {
    const out = adaptDailyPicksSnapshot({
      pick_date: "2026-09-16",
      generated_at: null,
      source: "scheduled",
      picks: [{ ...base, score_parts: { demand: 1, margin: 0.5, catalog: 1, brand_fit: 1 } }],
    });
    expect("striking" in out.picks[0].scoreParts).toBe(false);
    expect(out.picks[0].striking).toBeNull();
  });

  it("maps a measured part and its evidence", () => {
    const out = adaptDailyPicksSnapshot({
      pick_date: "2026-09-17",
      generated_at: null,
      source: "scheduled",
      picks: [
        {
          ...base,
          score_parts: { demand: 1, striking: 0.42, margin: 0.5, catalog: 1, brand_fit: 1 },
          striking: {
            query: "black maxi skirt",
            position: 11.7,
            impressions: 6522,
            potential_clicks: 600,
            matched_queries: 12,
          },
        },
      ],
    });
    expect(out.picks[0].scoreParts.striking).toBe(0.42);
    expect(out.picks[0].striking).toEqual({
      query: "black maxi skirt",
      position: 11.7,
      impressions: 6522,
      potentialClicks: 600,
      matchedQueries: 12,
    });
  });
});
