/**
 * SPEC-161 — "Today's focus" partition + discovery grouping.
 *
 * The partition must be TOTAL: this list is how someone decides what to work on,
 * so a query silently vanishing from both halves would be worse than no feature.
 */
import { describe, expect, it } from "vitest";

import {
  bankCountLabel,
  groupQueriesByCluster,
  querySourceLabel,
  splitTodaysFocus,
} from "@/lib/spotlight";
import type { SpotlightQuery } from "@/types/spotlight";

function q(
  id: number,
  cluster: string | null,
  parentCategory: string | null = null,
  source = "derived",
): SpotlightQuery {
  return {
    id,
    keyword: `keyword-${id}`,
    monthlyVolume: null,
    persona: "The Discovery Customer",
    intent: "high",
    source,
    cluster,
    parentCategory,
  };
}

describe("splitTodaysFocus", () => {
  const bank = [q(1, "skirts"), q(2, "dresses"), q(3, "tops"), q(4, "belts")];

  it("puts focus-cluster queries first, in pick order", () => {
    const { focus } = splitTodaysFocus(bank, ["tops", "skirts"]);
    expect(focus.map((x) => x.cluster)).toEqual(["tops", "skirts"]);
  });

  it("leaves everything in `rest` when there are no picks yet", () => {
    const { focus, rest } = splitTodaysFocus(bank, []);
    expect(focus).toEqual([]);
    expect(rest).toHaveLength(bank.length);
  });

  it("is a TOTAL partition — nothing lost, nothing duplicated", () => {
    const { focus, rest } = splitTodaysFocus(bank, ["tops", "skirts"]);
    const ids = [...focus, ...rest].map((x) => x.id).sort();
    expect(ids).toEqual([1, 2, 3, 4]);
    expect(new Set(ids).size).toBe(4);
  });

  it("matches clusters case-insensitively", () => {
    expect(splitTodaysFocus(bank, ["SKIRTS"]).focus).toHaveLength(1);
  });

  it("ignores a null-cluster query rather than crashing", () => {
    const withNull = [...bank, q(5, null)];
    const { focus, rest } = splitTodaysFocus(withNull, ["skirts"]);
    expect(focus).toHaveLength(1);
    expect(rest).toHaveLength(4);
  });

  it("does not double-seat a cluster listed twice in the picks", () => {
    const { focus } = splitTodaysFocus(bank, ["skirts", "skirts"]);
    expect(focus).toHaveLength(1);
  });
});

describe("groupQueriesByCluster with discovered keywords (SPEC-163)", () => {
  it("groups a discovered keyword under its real parent category", () => {
    const groups = groupQueriesByCluster([
      q(1, "tops"),
      q(2, "modest workout tops for women", "tops", "researched"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].queries).toHaveLength(2);
  });

  it("still groups ordinary rows by cluster when there is no parent", () => {
    const groups = groupQueriesByCluster([q(1, "tops"), q(2, "skirts")]);
    expect(groups).toHaveLength(2);
  });
});

describe("querySourceLabel", () => {
  it("uses the same word as the Daily Picks chip for a discovery", () => {
    expect(querySourceLabel("researched")).toBe("Research");
  });
});

describe("bankCountLabel (SPEC-162)", () => {
  it("says how many MORE there are when nothing is filtered", () => {
    expect(bankCountLabel(296, 296)).toBe("296 more searches");
  });

  it("switches to a ratio while filtering", () => {
    expect(bankCountLabel(12, 296)).toBe("12 of 296");
  });

  it("keeps the singular readable", () => {
    expect(bankCountLabel(1, 1)).toBe("1 more search");
  });
});

describe("focus/bank partition drives the UI counts (SPEC-162)", () => {
  it("panel + bank sum to the whole, so nothing looks lost", () => {
    const bank = Array.from({ length: 20 }, (_, i) =>
      q(i, i < 5 ? "tops" : "skirts"),
    );
    const { focus, rest } = splitTodaysFocus(bank, ["tops"]);
    expect(focus).toHaveLength(5);
    expect(rest).toHaveLength(15);
    expect(focus.length + rest.length).toBe(bank.length);
  });

  it("no row appears in both halves", () => {
    const bank = [q(1, "tops"), q(2, "skirts"), q(3, "tops")];
    const { focus, rest } = splitTodaysFocus(bank, ["tops"]);
    const focusIds = new Set(focus.map((x) => x.id));
    expect(rest.some((x) => focusIds.has(x.id))).toBe(false);
  });
});
