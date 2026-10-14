import { describe, expect, it } from "vitest";

import { adaptDiscountDecisions, type ApiDiscountDecisions } from "@/lib/adapters";
import {
  decisionBadgeClass,
  givenCell,
  givenLine,
  hasComparison,
  isCompared,
  marginCell,
  noComparisonLine,
  ordersCell,
  revenueCell,
  summaryTiles,
  windowText,
} from "@/lib/discount-decisions";
import type { DiscountDecision } from "@/types/analysis";

function decision(over: Partial<DiscountDecision> = {}): DiscountDecision {
  return {
    code: "SUMMER20",
    periodDays: 90,
    window: { start: "2026-08-01", end: "2026-08-14", days: 14, source: "shopify", openEnded: false },
    codeOrders: 412,
    codeRevenue: 38120.5,
    discountGiven: 9530.1,
    newCustomers: 61,
    existingOrders: 301,
    discountToExisting: 6960,
    existingSharePct: 73,
    store: {
      ordersPerDayBefore: 88.4,
      ordersPerDayDuring: 115.9,
      ordersDeltaPct: 31.1,
      revenuePerDayBefore: 12640,
      revenuePerDayDuring: 15230,
      revenueDeltaPct: 20.5,
      marginPctBefore: 44.2,
      marginPctDuring: 36.1,
      marginDeltaPts: -8.1,
      coveragePct: 86,
    },
    verdict: "cost_margin",
    verdictLabel: "Cost margin",
    verdictTone: "warn",
    why: "…",
    ...over,
  };
}

describe("decisionBadgeClass", () => {
  it("uses semantic tokens only", () => {
    expect(decisionBadgeClass("bad")).toBe("bg-destructive/10 text-destructive");
    expect(decisionBadgeClass("neutral")).toBe("bg-muted text-foreground");
    expect(decisionBadgeClass("muted")).toBe("bg-muted text-muted-foreground");
  });
});

describe("compare cells", () => {
  it("read before → during with a signed delta and a tone", () => {
    const d = decision();
    expect(ordersCell(d)).toEqual({ text: "88.4 → 115.9", delta: "+31.1%", tone: "good" });
    expect(revenueCell(d)).toEqual({ text: "$12.6K → $15.2K", delta: "+20.5%", tone: "good" });
    expect(marginCell(d)).toEqual({ text: "44.2% → 36.1%", delta: "-8.1 pts", tone: "bad" });
  });

  it("dash out when there is nothing to compare", () => {
    for (const verdict of ["always_on", "too_small"] as const) {
      const d = decision({ verdict });
      expect(isCompared(d)).toBe(false);
      expect(ordersCell(d).text).toBe("—");
      expect(revenueCell(d).text).toBe("—");
      expect(marginCell(d).text).toBe("—");
    }
  });

  it("never invent a margin without cost data", () => {
    const d = decision({
      store: { ...decision().store, marginPctBefore: null, marginPctDuring: null, marginDeltaPts: null },
    });
    expect(marginCell(d)).toEqual({ text: "No cost data", delta: null, tone: "muted" });
  });
});

describe("hasComparison / noComparisonLine", () => {
  it("drops the comparison columns only when no row was judged", () => {
    expect(hasComparison([decision({ verdict: "always_on" }), decision({ verdict: "too_small" })])).toBe(false);
    expect(hasComparison([decision({ verdict: "always_on" }), decision()])).toBe(true);
    expect(hasComparison([])).toBe(false);
  });

  it("says why there is nothing to compare, in the store's own counts", () => {
    const base = { codesJudged: 0, worked: 0, costMargin: 0, noLift: 0, discountGiven: 0, discountToExisting: 0 };
    expect(noComparisonLine({ ...base, alwaysOn: 7, tooSmall: 18 })).toBe(
      "No campaigns in this range — 7 codes are standing credits and 18 had under 10 orders, so there is no before to compare. The comparison appears the first time a code with a start and end date runs.",
    );
    expect(noComparisonLine({ ...base, alwaysOn: 1, tooSmall: 0 })).toBe(
      "No campaigns in this range — 1 code is a standing credit, so there is no before to compare. The comparison appears the first time a code with a start and end date runs.",
    );
    expect(noComparisonLine({ ...base, alwaysOn: 0, tooSmall: 0 })).toBe(
      "No campaigns in this range. The comparison appears the first time a code with a start and end date runs.",
    );
  });
});

describe("windowText", () => {
  it("shows the campaign dates, or the always-on coverage", () => {
    expect(windowText(decision())).toBe("Aug 1 – Aug 14 · 14 d");
    expect(
      windowText(
        decision({ window: { start: "2026-09-13", end: "2026-09-13", days: 1, source: "orders", openEnded: false } }),
      ),
    ).toBe("Sep 13 · 1 d");
    expect(
      windowText(
        decision({ verdict: "always_on", window: { start: "x", end: "y", days: 90, source: "orders", openEnded: false } }),
      ),
    ).toBe("90 of 90 days");
    expect(
      windowText(
        decision({ verdict: "always_on", window: { start: "x", end: "y", days: 30, source: "shopify", openEnded: true } }),
      ),
    ).toBe("No end date");
  });
});

describe("givenCell / givenLine", () => {
  it("say what was given and how much went to existing customers", () => {
    expect(givenCell(decision())).toBe("$9,530.10 · 73% to existing");
    expect(givenCell(decision({ existingSharePct: null }))).toBe("$9,530.10");
    expect(
      givenLine({
        codesJudged: 0, worked: 0, costMargin: 0, noLift: 0, alwaysOn: 7, tooSmall: 18,
        discountGiven: 1334224.15, discountToExisting: 1166450.04,
      }),
    ).toBe("$1.3M given · 87.4% to customers who had bought before");
  });
});

describe("summaryTiles", () => {
  it("is judged first, then every verdict in the backend's order", () => {
    const tiles = summaryTiles({
      codesJudged: 1, worked: 0, costMargin: 1, noLift: 0, alwaysOn: 7, tooSmall: 18,
      discountGiven: 0, discountToExisting: 0,
    });
    expect(tiles.map((t) => t.key)).toEqual([
      "judged", "worked", "cost_margin", "no_lift", "always_on", "too_small",
    ]);
    expect(tiles[4]).toEqual({ key: "always_on", label: "Always on", value: "7", tone: "neutral" });
  });
});

describe("adaptDiscountDecisions", () => {
  it("maps snake_case and keeps nulls", () => {
    const raw: ApiDiscountDecisions = {
      period: { start: "a", end: "b" },
      summary: {
        codes_judged: 0, worked: 0, cost_margin: 0, no_lift: 0, always_on: 1, too_small: 0,
        discount_given: 841540, discount_to_existing: 815000,
      },
      decisions: [{
        code: "CUSTOM DISCOUNT", period_days: 90,
        window: { start: "2026-06-17", end: "2026-09-15", days: 90, source: "orders", open_ended: false },
        code_orders: 233, code_revenue: 100, discount_given: 841540, new_customers: 3,
        existing_orders: 200, discount_to_existing: 815000, existing_share_pct: 96.9,
        store: {
          orders_per_day_before: 456.9, orders_per_day_during: 449.2, orders_delta_pct: -1.7,
          revenue_per_day_before: 119522, revenue_per_day_during: 105183, revenue_delta_pct: -12,
          margin_pct_before: null, margin_pct_during: null, margin_delta_pts: null, coverage_pct: 0,
        },
        verdict: "always_on", verdict_label: "Always on", verdict_tone: "neutral", why: "…",
      }],
    };
    const data = adaptDiscountDecisions(raw);
    expect(data.summary.alwaysOn).toBe(1);
    expect(data.decisions[0]).toMatchObject({
      code: "CUSTOM DISCOUNT", periodDays: 90, verdict: "always_on",
      window: { source: "orders", openEnded: false },
      store: { marginPctBefore: null, marginDeltaPts: null, coveragePct: 0 },
    });
  });
});
