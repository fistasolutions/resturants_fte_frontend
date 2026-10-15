/** Frontend SPEC-385 — the Ops Coach's pure half. */
import { describe, expect, it } from "vitest";

import { changeLabel, emailable, factLine, filterBriefs, needsAction } from "@/lib/ops-coach";
import type { CoachBrief } from "@/types/restaurant-os";

function brief(over: Partial<CoachBrief> & { focus: CoachBrief["focus"] }): CoachBrief {
  return {
    id: 1,
    branchId: 1,
    focusLabel: "",
    severity: 1,
    text: "",
    wins: [],
    emailedAt: null,
    hasManagerEmail: true,
    facts: {
      code: "101",
      name: "Downtown",
      netSales: 2000,
      lastWeekNetSales: 1800,
      change: 0.111,
      transactions: 100,
      averageTicket: 20,
      onTimeRate: 0.8,
      deliveriesTimed: 30,
      avgDeliveryMinutes: 25,
      laborPct: 0.28,
      voids: 2,
      voidValue: 30,
    },
    ...over,
  };
}

describe("the Ops Coach (SPEC-385)", () => {
  it("filters briefs by focus, keeping the backend's order", () => {
    const list = [brief({ id: 1, focus: "late" }), brief({ id: 2, focus: "on_track" }), brief({ id: 3, focus: "voids" })];
    expect(filterBriefs(list, "action").map((b) => b.id)).toEqual([1, 3]);
    expect(filterBriefs(list, "all")).toHaveLength(3);
    expect(filterBriefs(list, "voids").map((b) => b.id)).toEqual([3]);
    expect(needsAction("on_track")).toBe(false);
  });

  it("words the change and the facts", () => {
    expect(changeLabel(0.111)).toBe("+11% vs last week");
    expect(changeLabel(-0.2)).toBe("−20% vs last week");
    expect(changeLabel(null)).toBeNull();
    const money = (v: number) => `$${v}`;
    expect(factLine(brief({ focus: "late" }).facts, money)).toEqual([
      "$2000 sales",
      "100 orders",
      "+11% vs last week",
      "80% on time",
      "labor 28%",
      "2 voids",
    ]);
    expect(factLine({ ...brief({ focus: "silent" }).facts, deliveriesTimed: 0, laborPct: null, voids: 1, change: null }, money)).toEqual([
      "$2000 sales",
      "100 orders",
      "1 void",
    ]);
  });

  it("counts what can still be emailed", () => {
    expect(
      emailable([
        brief({ focus: "late" }),
        brief({ focus: "late", emailedAt: "2026-10-16T10:00:00Z" }),
        brief({ focus: "late", hasManagerEmail: false }),
      ]),
    ).toBe(1);
  });
});
