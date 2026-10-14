import { describe, expect, it } from "vitest";

import { ADDABLE_BLOCKS, blockLabel, blocksProblem, hasPickedForYou, newBlock, pickFallback } from "@/lib/email-blocks";
import { BEST_TIME_UNAVAILABLE, bestTimeChoice, bestTimeDetail, picksSummary, PICKS_SHOWN, spokenHour } from "@/lib/email-brain";
import { initialDraft, stepProblem, strategyHour, strategyLabel } from "@/lib/email-builder";
import { REASON_LABELS } from "@/lib/email-plan";
import type { ContentBlock } from "@/types/email-marketing";

describe("the audience's best time reads in the owner's words (SPEC-368)", () => {
  it("speaks an hour on a twelve-hour clock", () => {
    expect(spokenHour(19)).toBe("7 pm");
    expect(spokenHour(0)).toBe("12 am");
    expect(spokenHour(12)).toBe("12 pm");
    expect(spokenHour(9)).toBe("9 am");
  });

  it("names the audience and how many customers the hour came from", () => {
    expect(bestTimeDetail({ hour: 19, basis: "audience", customers: 1240 })).toBe(
      "Each customer at 7 pm their time — when most of this audience orders (from 1,240 customers)",
    );
  });

  it("says when the hour is the store's own", () => {
    expect(bestTimeDetail({ hour: 11, basis: "store", customers: 0 })).toBe("Each customer at 11 am their time — when your store gets most orders");
  });

  it("is selectable only with a best hour, and gives the backend's reason otherwise", () => {
    expect(bestTimeChoice({ status: "ready", bestTime: { hour: 19, basis: "audience", customers: 40 } })).toEqual({
      available: true,
      detail: "Each customer at 7 pm their time — when most of this audience orders (from 40 customers)",
    });
    expect(bestTimeChoice({ status: "ready", bestTime: null })).toEqual({ available: false, detail: BEST_TIME_UNAVAILABLE });
    for (const status of ["pending", "unsaved", "error"] as const) {
      expect(bestTimeChoice({ status }).available).toBe(false);
    }
  });
});

describe("the strategy label names the best time (SPEC-368)", () => {
  it("names the hour once the server has it", () => {
    expect(strategyLabel({ kind: "best_time", date: "2026-10-09" }, { hour: 19, basis: "audience", customers: 1240 })).toBe(
      "Best time for this audience: 7 pm on Fri, Oct 9, in each customer's timezone",
    );
  });

  it("names the day without it, and leaves the hour to the server", () => {
    expect(strategyLabel({ kind: "best_time", date: "2026-10-09" })).toBe("Best time for this audience on Fri, Oct 9");
    expect(strategyLabel({ kind: "best_time", date: "2026-10-09" }, null)).toBe("Best time for this audience on Fri, Oct 9");
    expect(strategyHour({ kind: "best_time", date: "2026-10-09" })).toBeNull();
  });

  it("keeps every existing strategy's label", () => {
    expect(strategyLabel({ kind: "immediate" })).toBe("Send now");
    expect(strategyLabel({ kind: "smart", date: "2026-10-09" })).toBe("Smart send time on Fri, Oct 9");
  });
});

describe("Picked for you (SPEC-368)", () => {
  it("is an addable block with its label and an empty fallback", () => {
    expect(ADDABLE_BLOCKS).toContain("picked_for_you");
    expect(blockLabel("picked_for_you")).toBe("Picked for you");
    const block = newBlock("picked_for_you", "p1");
    expect(block).toMatchObject({ id: "p1", kind: "picked_for_you", title: "Picked for you", productIds: [] });
    expect(block.body.length).toBeGreaterThan(0);
    expect(pickFallback(block)).toBeNull();
  });

  it("needs its fallback product before the content step is ready", () => {
    const empty = newBlock("picked_for_you", "p1");
    expect(blocksProblem([empty])).toMatch(/fallback product/);
    const chosen: ContentBlock = { ...empty, productIds: [42] };
    expect(blocksProblem([chosen])).toBeNull();
    expect(pickFallback(chosen)).toBe(42);
    expect(hasPickedForYou([chosen])).toBe(true);
    expect(hasPickedForYou([newBlock("hero", "h1")])).toBe(false);

    const draft = initialDraft("newsletter", { id: "d1", excluded: [], today: "2026-10-09", catalog: [], post: null });
    expect(stepProblem("content", draft)).toBeNull();
    expect(stepProblem("content", { ...draft, blocks: [empty, ...draft.blocks] })).toMatch(/fallback product/);
    expect(stepProblem("content", { ...draft, blocks: [chosen, ...draft.blocks] })).toBeNull();
  });

  it("is no fallback on any other block", () => {
    expect(pickFallback({ id: "g", kind: "product_grid", title: "", body: "", productIds: [7] })).toBeNull();
  });
});

describe("what customers will be shown (SPEC-368)", () => {
  it("lists the top five picks, most customers first, in a stable order", () => {
    const picks = [
      { productId: 3, title: "Linen shirt", customers: 40 },
      { productId: 1, title: "Wool coat", customers: 120 },
      { productId: 9, title: "Belt", customers: 40 },
      { productId: 4, title: "Scarf", customers: 12 },
      { productId: 5, title: "Hat", customers: 8 },
      { productId: 6, title: "Gloves", customers: 3 },
      { productId: 7, title: "Nobody", customers: 0 },
    ];
    const summary = picksSummary(picks);
    expect(summary.rows.map((p) => p.productId)).toEqual([1, 9, 3, 4, 5]);
    expect(summary.rows).toHaveLength(PICKS_SHOWN);
    expect(summary.customers).toBe(220);
  });

  it("is empty on an older backend or with no picks", () => {
    expect(picksSummary(undefined)).toEqual({ rows: [], customers: 0 });
    expect(picksSummary([])).toEqual({ rows: [], customers: 0 });
  });
});

describe("the plan names the rhythm rule (backend SPEC-378)", () => {
  it("labels a slot proposed from a customer's reorder rhythm", () => {
    expect(REASON_LABELS.rhythm).toBe("Reorder rhythm");
  });
});
