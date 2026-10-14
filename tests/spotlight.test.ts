import { describe, expect, it } from "vitest";

import {
  groupQueriesByCluster,
  hasFullQualityScores,
  heroUrl,
  normalizeSpotlightTab,
  overallQualityScore,
  pickHeadlineScore,
  pickModifierNotes,
  pickRotationNote,
  querySourceLabel,
  seoTone,
  SPOTLIGHT_TAB_IDS,
} from "@/lib/spotlight";
import type { SpotlightQuery } from "@/types/spotlight";

// Note: the `services/spotlight` mock-seam assertions were removed when
// `getBrandBrain` went live (SPEC-108) — that module now imports the
// server-only `serverApi`, which cannot be loaded in Vitest's node env. The
// Brand Brain data mapping is covered by the pure adapter in
// `tests/brand-brain-adapter.test.ts`; the remaining mock tabs are exercised
// through the app.

describe("normalizeSpotlightTab", () => {
  it("passes through every valid tab id", () => {
    for (const id of SPOTLIGHT_TAB_IDS) {
      expect(normalizeSpotlightTab(id)).toBe(id);
    }
  });

  it("falls back to overview for unknown / empty values", () => {
    expect(normalizeSpotlightTab("bogus")).toBe("overview");
    expect(normalizeSpotlightTab(null)).toBe("overview");
    expect(normalizeSpotlightTab(undefined)).toBe("overview");
    expect(normalizeSpotlightTab("")).toBe("overview");
  });
});

describe("seoTone", () => {
  it("buckets by score thresholds (>=80 strong, >=60 fair, else weak)", () => {
    expect(seoTone(91)).toBe("strong");
    expect(seoTone(80)).toBe("strong");
    expect(seoTone(79)).toBe("fair");
    expect(seoTone(60)).toBe("fair");
    expect(seoTone(59)).toBe("weak");
    expect(seoTone(0)).toBe("weak");
  });
});

describe("overallQualityScore (SPEC-121)", () => {
  it("averages the four dimensions when the harness scored them all", () => {
    // (88 + 79 + 74 + 91) / 4 = 83
    expect(
      overallQualityScore({ seo: 88, aeo: 79, geo: 74, quality: 91 }),
    ).toBe(83);
  });

  it("rounds to the nearest whole score", () => {
    // (90 + 81 + 76 + 88) / 4 = 83.75 → 84
    expect(
      overallQualityScore({ seo: 90, aeo: 81, geo: 76, quality: 88 }),
    ).toBe(84);
  });

  it("excludes null dimensions rather than counting them as 0", () => {
    // Only SEO present → the overall is just the SEO score, not diluted.
    expect(
      overallQualityScore({ seo: 94, aeo: null, geo: null, quality: null }),
    ).toBe(94);
  });
});

describe("hasFullQualityScores (SPEC-121)", () => {
  it("is true only when every non-SEO dimension is present", () => {
    expect(hasFullQualityScores({ seo: 90, aeo: 80, geo: 70, quality: 88 })).toBe(
      true,
    );
    expect(hasFullQualityScores({ seo: 90, aeo: null, geo: 70, quality: 88 })).toBe(
      false,
    );
    expect(
      hasFullQualityScores({ seo: 90, aeo: null, geo: null, quality: null }),
    ).toBe(false);
  });
});

describe("heroUrl (SPEC-122)", () => {
  it("routes through the proxy for the draft's hero PNG", () => {
    expect(heroUrl(42)).toBe("/api/proxy/spotlight/drafts/42/hero");
  });

  it("appends an encoded cache-bust version when given", () => {
    expect(heroUrl(7, "2026-08-13T10:00:00+00:00")).toBe(
      "/api/proxy/spotlight/drafts/7/hero?v=2026-08-13T10%3A00%3A00%2B00%3A00",
    );
  });

  it("omits the version param for null/empty versions", () => {
    expect(heroUrl(3, null)).toBe("/api/proxy/spotlight/drafts/3/hero");
    expect(heroUrl(3, "")).toBe("/api/proxy/spotlight/drafts/3/hero");
  });
});


describe("querySourceLabel (SPEC-125)", () => {
  it("labels the known query-bank sources", () => {
    expect(querySourceLabel("search_console")).toBe("Search Console");
    expect(querySourceLabel("derived")).toBe("Suggested");
  });

  it("title-cases an unknown source and handles empty", () => {
    expect(querySourceLabel("ai_generated")).toBe("Ai generated");
    expect(querySourceLabel("")).toBe("—");
  });
});

describe("groupQueriesByCluster (SPEC-125)", () => {
  const q = (
    id: number,
    cluster: string | null,
    source = "derived",
  ): SpotlightQuery => ({
    id,
    keyword: `keyword-${id}`,
    monthlyVolume: null,
    persona: "The Modern Modest Woman",
    intent: "high",
    source,
    cluster,
    parentCategory: null,
  });

  it("groups by cluster, preserving first-seen order and title-casing headings", () => {
    const groups = groupQueriesByCluster([
      q(1, "skirts"),
      q(2, "dresses"),
      q(3, "skirts"),
    ]);
    expect(groups.map((g) => g.cluster)).toEqual(["skirts", "dresses"]);
    expect(groups[0].label).toBe("Skirts");
    expect(groups[0].queries.map((query) => query.id)).toEqual([1, 3]);
    expect(groups[1].queries.map((query) => query.id)).toEqual([2]);
  });

  it("collects null/blank clusters into a single 'Other searches' bucket placed last", () => {
    const groups = groupQueriesByCluster([
      q(1, null, "search_console"),
      q(2, "dresses"),
      q(3, "  "),
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Dresses", "Other searches"]);
    const other = groups[groups.length - 1];
    expect(other.cluster).toBe("");
    expect(other.queries.map((query) => query.id)).toEqual([1, 3]);
  });

  it("returns an empty list for no queries", () => {
    expect(groupQueriesByCluster([])).toEqual([]);
  });
});

describe("the pick headline (SPEC-164 Patches)", () => {
  it("leads with the fit when the backend sent it, else the ranking score", () => {
    expect(pickHeadlineScore({ score: 0.46, scoreParts: { fit: 0.892 } })).toBe(89);
    expect(pickHeadlineScore({ score: 0.46, scoreParts: {} })).toBe(46);
  });

  it("words the rotation as days since it was written", () => {
    expect(pickRotationNote(1)).toBeNull();
    expect(pickRotationNote(0.5)).toBe("Ranked lower today — written today");
    expect(pickRotationNote(0.55)).toBe("Ranked lower today — written 3 days ago");
    expect(pickRotationNote(0.75)).toBe("Ranked lower today — written 15 days ago");
    expect(pickModifierNotes({ freshness: 0.5, performance: 1 })).toEqual(["Ranked lower today — written today"]);
  });
});
