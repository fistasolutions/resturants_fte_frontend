import { describe, expect, it } from "vitest";

import { DECISION_PRIMARY_LIMIT, moreDecisionsLabel, splitDecisions } from "@/lib/brief-decisions";
import type { BriefDecision } from "@/types/brief";

function decision(type: string): BriefDecision {
  return {
    type,
    headline: type,
    amount: 1,
    amount_label: "",
    sentiment: "risk",
    why: "",
    evidence_tag: "",
    evidence_items: [],
    evidence_definition: "",
    view_href: "/",
    state: null,
    acted_at: null,
  };
}

const many = (n: number) => Array.from({ length: n }, (_, i) => decision(`d${i}`));

describe("splitDecisions", () => {
  it("keeps the first five in the backend's order and folds the rest", () => {
    const { primary, extra } = splitDecisions(many(8));
    expect(primary.map((d) => d.type)).toEqual(["d0", "d1", "d2", "d3", "d4"]);
    expect(extra.map((d) => d.type)).toEqual(["d5", "d6", "d7"]);
    expect(DECISION_PRIMARY_LIMIT).toBe(5);
  });

  it("folds nothing when everything fits — today's three decisions stay as they are", () => {
    const { primary, extra } = splitDecisions(many(3));
    expect(primary).toHaveLength(3);
    expect(extra).toEqual([]);
  });

  it("handles an empty list and a custom limit", () => {
    expect(splitDecisions([])).toEqual({ primary: [], extra: [] });
    expect(splitDecisions(many(4), 2).extra).toHaveLength(2);
  });
});

describe("moreDecisionsLabel", () => {
  it("pluralises", () => {
    expect(moreDecisionsLabel(1)).toBe("Show 1 more decision");
    expect(moreDecisionsLabel(3)).toBe("Show 3 more decisions");
  });
});
