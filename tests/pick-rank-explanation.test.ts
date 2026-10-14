/**
 * SPEC-164 — the ⓘ explanation on each Daily Pick.
 *
 * Computed, never generated: these tests pin the logic that replaces an LLM call,
 * so the reason a pick gives can never drift from the numbers on its own card.
 */
import { describe, expect, it } from "vitest";

import { formatStrikingEvidence, pickRankExplanation, scoreWeightsFor } from "@/lib/spotlight";
import type { DailyPickScoreParts } from "@/types/spotlight";

function parts(over: Partial<DailyPickScoreParts> = {}): DailyPickScoreParts {
  return {
    demand: 0.5,
    margin: 0.5,
    catalog: 0.5,
    brandFit: 0.5,
    freshness: 1,
    performance: 1,
    ...over,
  };
}

describe("the driver line", () => {
  it("picks the biggest weighted CONTRIBUTION, not the tallest bar", () => {
    // Brand fit is maxed (1.0 × 0.15 = 0.15) but demand contributes more
    // (0.8 × 0.40 = 0.32). Ranking by the raw bar would credit brand fit.
    const [line] = pickRankExplanation(
      parts({ demand: 0.8, brandFit: 1, margin: 0, catalog: 0 }),
      1,
      "derived",
    );
    expect(line).toMatch(/shoppers search for this/i);
    expect(line).not.toMatch(/persona/i);
  });

  it("credits margin when it genuinely leads", () => {
    const [line] = pickRankExplanation(
      parts({ demand: 0.1, margin: 1, catalog: 0.1, brandFit: 0.1 }),
      2,
      "derived",
    );
    expect(line).toMatch(/earns more per sale/i);
  });
});

describe("the limiter line", () => {
  it("names the biggest weighted shortfall — the actionable one", () => {
    const [, line] = pickRankExplanation(
      parts({ demand: 1, margin: 1, catalog: 0, brandFit: 1 }),
      1,
      "derived",
    );
    expect(line).toMatch(/few products/i);
  });

  it("still returns a sensible line when the pick is strong everywhere", () => {
    const [, line] = pickRankExplanation(
      parts({ demand: 1, margin: 1, catalog: 1, brandFit: 1 }),
      1,
      "derived",
    );
    expect(line.length).toBeGreaterThan(10);
  });
});

describe("the why-now line", () => {
  it("leads with real performance when the topic already earns clicks", () => {
    const [, , line] = pickRankExplanation(parts({ performance: 1.15 }), 1, "derived");
    expect(line).toMatch(/earning clicks/i);
  });

  it("explains a lower rank caused by recent coverage", () => {
    const [, , line] = pickRankExplanation(parts({ freshness: 0.5 }), 3, "derived");
    expect(line).toMatch(/covered this recently/i);
  });

  it("flags a discovery that has no history at all", () => {
    const [, , line] = pickRankExplanation(parts(), 4, "researched");
    expect(line).toMatch(/newly found by research/i);
  });

  it("falls back to the plain not-covered-recently case", () => {
    const [, , line] = pickRankExplanation(parts(), 5, "derived");
    expect(line).toMatch(/haven't covered this/i);
  });

  it("prefers performance over freshness when both apply", () => {
    const [, , line] = pickRankExplanation(
      parts({ performance: 1.15, freshness: 0.5 }),
      1,
      "derived",
    );
    expect(line).toMatch(/earning clicks/i);
  });
});

describe("rank-accurate wording", () => {
  it('only rank 1 claims to be the top pick', () => {
    expect(pickRankExplanation(parts(), 1, "derived")[0]).toMatch(/top pick/i);
  });

  it("a lower rank states its position instead of claiming best", () => {
    const [line] = pickRankExplanation(parts(), 7, "derived");
    expect(line).toMatch(/#7/);
    expect(line).not.toMatch(/top pick/i);
  });
});

describe("shape", () => {
  it("always returns exactly three non-empty lines", () => {
    const cases: Partial<DailyPickScoreParts>[] = [
      {},
      { demand: 0, margin: 0, catalog: 0, brandFit: 0 },
      { demand: 1, margin: 1, catalog: 1, brandFit: 1 },
      { freshness: 0.25 },
      { performance: 0.9 },
    ];
    for (const over of cases) {
      for (const rank of [1, 5, 10]) {
        const lines = pickRankExplanation(parts(over), rank, "derived");
        expect(lines).toHaveLength(3);
        expect(lines.every((l) => l.trim().length > 0)).toBe(true);
      }
    }
  });
});

describe("striking distance in the explanation (SPEC-265)", () => {
  const measured = {
    demand: 0.5,
    striking: 1,
    margin: 0.4,
    catalog: 0.75,
    brandFit: 1,
    freshness: 1,
    performance: 1,
  };

  it("uses the measured weights so striking can be the driver", () => {
    const [driver] = pickRankExplanation(measured, 1, "derived");
    expect(driver).toMatch(/already rank on page two/);
  });

  it("names striking as the limiter when nothing is within reach", () => {
    const [, limiter] = pickRankExplanation(
      { ...measured, striking: 0, demand: 1, margin: 1, catalog: 1, brandFit: 1 },
      2,
      "derived",
    );
    expect(limiter).toMatch(/nothing you already rank for/);
  });

  it("leads the why-now line with the evidence and formats the numbers", () => {
    const lines = pickRankExplanation(measured, 1, "derived", {
      query: "black maxi skirt",
      position: 11.7,
      impressions: 6522,
    });
    expect(lines[2]).toBe(
      'Why now: you rank #11.7 for "black maxi skirt" — 6,522 searches saw it in 28 days — page one is one good post away.',
    );
    expect(formatStrikingEvidence({ query: "black skirt", position: 9, impressions: 4254 })).toBe(
      'You rank #9 for "black skirt" — 4,254 searches saw it in 28 days',
    );
    expect(formatStrikingEvidence(null)).toBeNull();
  });

  it("falls back to the legacy weights and copy when striking is unmeasured", () => {
    const legacy = { demand: 1, margin: 0.2, catalog: 0.3, brandFit: 1, freshness: 1, performance: 1 };
    expect(scoreWeightsFor(legacy)).toEqual({ demand: 0.4, margin: 0.25, catalog: 0.2, brandFit: 0.15 });
    expect(scoreWeightsFor(measured).striking).toBe(0.2);
    const [driver, limiter] = pickRankExplanation(legacy, 1, "derived");
    expect(driver).toMatch(/shoppers search for this/);
    expect(limiter).not.toMatch(/already rank/);
  });
});
