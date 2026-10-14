/**
 * SPEC-159 (frontend) — Daily Pick provenance labels + rank-modifier wording.
 *
 * The point of this surface is that a research guess can never be mistaken for
 * measured demand, so the mapping is tested per source rather than in aggregate.
 */
import { describe, expect, it } from "vitest";

import { adaptDailyPicksSnapshot, type ApiDailyPicksSnapshot } from "@/lib/adapters";
import {
  isResearchedPick,
  pickModifierNotes,
  pickSourceLabel,
  pickSourceTone,
} from "@/lib/spotlight";

describe("pickSourceLabel", () => {
  it("names each known source", () => {
    expect(pickSourceLabel("search_console")).toBe("Measured");
    expect(pickSourceLabel("researched")).toBe("Research");
    expect(pickSourceLabel("derived")).toBe("Suggested");
  });

  it("degrades gracefully for an unknown source instead of throwing", () => {
    expect(pickSourceLabel("some_new_lane")).toBe("Some new lane");
    expect(pickSourceLabel("")).toBe("Suggested");
  });
});

describe("pickSourceTone", () => {
  it("gives measured demand a distinct treatment from a research guess", () => {
    expect(pickSourceTone("search_console")).not.toBe(pickSourceTone("researched"));
  });

  it("uses only semantic tokens (no hardcoded colors)", () => {
    for (const source of ["search_console", "researched", "derived"]) {
      expect(pickSourceTone(source)).not.toMatch(/#[0-9a-f]{3,6}|\[.*\]/i);
    }
  });
});

describe("isResearchedPick", () => {
  it("is true only for the discovery lane", () => {
    expect(isResearchedPick("researched")).toBe(true);
    expect(isResearchedPick("search_console")).toBe(false);
    expect(isResearchedPick("derived")).toBe(false);
  });
});

describe("pickModifierNotes", () => {
  it("stays quiet when both multipliers are neutral", () => {
    expect(pickModifierNotes({ freshness: 1, performance: 1 })).toEqual([]);
  });

  it("explains a topic that was recently covered", () => {
    const notes = pickModifierNotes({ freshness: 0.25, performance: 1 });
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatch(/ranked lower today — written/i);
  });

  it("explains a well-performing topic", () => {
    expect(pickModifierNotes({ freshness: 1, performance: 1.15 })[0]).toMatch(
      /performs well/i,
    );
  });

  it("explains a topic that has not earned clicks", () => {
    expect(pickModifierNotes({ freshness: 1, performance: 0.9 })[0]).toMatch(
      /hasn't earned clicks/i,
    );
  });

  it("reports both modifiers when both are non-neutral", () => {
    expect(pickModifierNotes({ freshness: 0.5, performance: 1.1 })).toHaveLength(2);
  });
});

describe("adaptDailyPick — backward compatibility", () => {
  /** A snapshot frozen BEFORE the backend change: no `source`, no multipliers. */
  const legacy: ApiDailyPicksSnapshot = {
    pick_date: "2026-08-01",
    generated_at: null,
    source: "scheduled",
    picks: [
      {
        cluster: "skirts",
        keyword: "modest skirts",
        intent: "high",
        persona: "The Discovery Customer",
        title: "A title",
        angle: "",
        fills: "",
        rationale: "",
        featured_product_ids: [],
        score: 0.5,
        score_parts: { demand: 1, margin: 0, catalog: 0, brand_fit: 1 },
      },
    ],
  };

  it("defaults an old pick to 'derived' rather than crashing", () => {
    expect(adaptDailyPicksSnapshot(legacy).picks[0].source).toBe("derived");
  });

  it("defaults missing multipliers to 1 (neutral), never 0", () => {
    const { freshness, performance } = adaptDailyPicksSnapshot(legacy).picks[0]
      .scoreParts;
    expect(freshness).toBe(1);
    expect(performance).toBe(1);
    // And therefore renders no modifier noise on a historical card.
    expect(pickModifierNotes({ freshness, performance })).toEqual([]);
  });
});
