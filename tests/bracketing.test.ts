/**
 * SPEC-309 — the Bracketing tab's adapters and page logic. The tab names customers, so the
 * tests hold what could mislead: an unknown rate shown as 0%, a split that doesn't add to
 * 100, a sort that floats a missing figure to the top.
 */
import { describe, expect, it } from "vitest";

import { toBracketing, type ApiBracketing } from "@/lib/bracketing-api";
import { nextSort, outcomeSplit, pageRows, pctText, sortBracketStyles } from "@/lib/bracketing";
import type { BracketStyle } from "@/types/bracketing";

const RAW: ApiBracketing = {
  summary: {
    orders: 144898, bracket_orders: 8842, bracket_share: 0.061, brackets: 14227, kept_all: 7186,
    kept_one: 4023, kept_some: 441, returned_all: 2577, units: 56046, units_returned: 11759,
    refunded: 885400.35, all_refunded: 6596010.73, refunded_share: 0.1342,
  },
  channels: [{ channel: "in_store", bracket_orders: 5486, brackets: 7661, kept_one: 2548, refunded: 519876.7 }],
  styles: [
    {
      product_id: 7, title: "Mindy Skirt SS26", vendor: "MELI", image_url: null, orders: 396,
      bracket_orders: 58, bracket_rate: 0.1465, brackets: 58, kept_one: 9, returned_all: 4,
      units_returned: 70, refunded: 4515.8, fit_verdict: null,
    },
  ],
  repeat_bracketers: [
    {
      customer_id: 1, name: "Naomi K.", orders: 295, units: 900, units_returned: 543, return_rate: 0.6039,
      refunded: 65307.44, bracket_orders: 62, bracket_returns: 40, kept_one: 29, bracket_refunded: 9000,
    },
  ],
  high_return: [
    {
      customer_id: 2, name: "r•••@gmail.com", orders: null, units: null, units_returned: null,
      return_rate: null, refunded: null, bracket_orders: 0, kept_one: 0, bracket_refunded: 0,
    },
  ],
  window: { start: "2025-09-25", end: "2026-09-25" },
  rules: { repeat_bracket_orders: 3, repeat_return_share: 0.5, high_return_min_orders: 5, high_return_rate: 0.5 },
};

function style(over: Partial<BracketStyle>): BracketStyle {
  return {
    productId: 1, title: "A", vendor: null, imageUrl: null, orders: 10, bracketOrders: 1,
    bracketRate: 0.1, brackets: 1, keptOne: 0, returnedAll: 0, unitsReturned: 0, refunded: 10,
    fitVerdict: null, ...over,
  };
}

describe("adapters", () => {
  it("map the live shape and keep unknowns null", () => {
    const data = toBracketing(RAW);
    expect(data.summary).toMatchObject({ bracketOrders: 8842, keptOne: 4023, refundedShare: 0.1342 });
    expect(data.styles[0]).toMatchObject({ productId: 7, bracketRate: 0.1465, fitVerdict: null });
    expect(data.repeatBracketers[0]).toMatchObject({ bracketReturns: 40, returnRate: 0.6039 });
    expect(data.highReturn[0].returnRate).toBeNull();
    expect(data.highReturn[0].bracketReturns).toBe(0); // older backend without the field
    expect(data.rules.repeatReturnShare).toBe(0.5);
  });
});

describe("how brackets end", () => {
  it("splits into four shares that add to exactly 100", () => {
    const split = outcomeSplit(toBracketing(RAW).summary);
    expect(split.map((s) => s.key)).toEqual(["keptAll", "keptOne", "keptSome", "returnedAll"]);
    expect(split.reduce((t, s) => t + s.pct, 0)).toBe(100);
    expect(split.map((s) => s.pct)).toEqual([51, 28, 3, 18]);
  });

  it("is all zeros with no brackets", () => {
    const split = outcomeSplit({ brackets: 0, keptAll: 0, keptOne: 0, keptSome: 0, returnedAll: 0 });
    expect(split.every((s) => s.pct === 0)).toBe(true);
  });
});

describe("styles", () => {
  const rows = [
    style({ productId: 1, title: "B", refunded: 50, bracketRate: null }),
    style({ productId: 2, title: "A", refunded: 90, bracketRate: 0.2 }),
    style({ productId: 3, title: "C", refunded: 90, bracketRate: 0.05 }),
  ];

  it("sorts by money with stable ties, and sinks a missing rate", () => {
    expect(sortBracketStyles(rows, "refunded", -1).map((r) => r.productId)).toEqual([2, 3, 1]);
    expect(sortBracketStyles(rows, "bracketRate", -1).at(-1)?.productId).toBe(1);
    expect(sortBracketStyles(rows, "bracketRate", 1).at(-1)?.productId).toBe(1);
    expect(sortBracketStyles(rows, "title", 1).map((r) => r.title)).toEqual(["A", "B", "C"]);
  });

  it("flips on a second press; a new column starts in its natural order", () => {
    expect(nextSort({ key: "refunded", dir: -1 }, "refunded")).toEqual({ key: "refunded", dir: 1 });
    expect(nextSort({ key: "refunded", dir: -1 }, "title")).toEqual({ key: "title", dir: 1 });
    expect(nextSort({ key: "title", dir: 1 }, "keptOne")).toEqual({ key: "keptOne", dir: -1 });
  });

  it("pages at 25", () => {
    expect(pageRows(Array.from({ length: 51 }, (_, i) => i), 3).rows).toEqual([50]);
  });
});

describe("percent text", () => {
  it("reads a share and never invents one", () => {
    expect(pctText(0.061)).toBe("6.1%");
    expect(pctText(0.5, 0)).toBe("50%");
    expect(pctText(0.1)).toBe("10%");
    expect(pctText(null)).toBe("—");
  });
});

describe("the returns tabs (one list for the page and the shell)", () => {
  it("knows every tab, so the shell highlights the one showing", async () => {
    const { RETURNS_TAB_IDS, normalizeReturnsTab } = await import("@/lib/returns-tabs");
    expect(RETURNS_TAB_IDS).toEqual(["overview", "by-style", "sizing", "categories", "fixes", "bracketing"]);
    expect(normalizeReturnsTab("fixes")).toBe("fixes");
    expect(normalizeReturnsTab("bracketing")).toBe("bracketing");
    expect(normalizeReturnsTab("nope")).toBe("overview");
    expect(normalizeReturnsTab(null)).toBe("overview");
  });
});
