import { describe, expect, it } from "vitest";

import {
  filterInsights,
  insightCounts,
  insightKindLabel,
  isKnownDestination,
  normalizeInsightFilter,
  sortInsights,
  trendText,
} from "@/lib/support-insights";
import type { Insight } from "@/types/customer-support";

function insight(id: string, kind: Insight["kind"], dollars: number, tickets: number): Insight {
  return {
    id,
    kind,
    title: id,
    detail: "",
    tickets,
    trend: null,
    money: { amountMinor: dollars * 100, currency: "USD" },
    moneyBasis: "basis",
    owner: "Operations",
    evidence: { label: "Warehouse", href: "/warehouse" },
    sendTo: { label: "Warehouse", href: "/warehouse" },
  };
}

const ALL = [insight("a", "late", 5960, 15), insight("b", "size_chart", 486, 12), insight("c", "size_chart", 486, 14), insight("d", "policy", 84, 6)];

describe("Insights", () => {
  it("reads the fix worth most first: money, then tickets, then title", () => {
    expect(sortInsights(ALL).map((i) => i.id)).toEqual(["a", "c", "b", "d"]);
  });

  it("filters by kind and counts for the chips", () => {
    expect(filterInsights(ALL, "size_chart").map((i) => i.id)).toEqual(["b", "c"]);
    expect(filterInsights(ALL, "all")).toHaveLength(4);
    expect(insightCounts(ALL)).toEqual({ all: 4, size_chart: 2, damage: 0, late: 1, policy: 1, product: 0 });
  });

  it("normalises the filter from the URL", () => {
    expect(normalizeInsightFilter("damage")).toBe("damage");
    expect(normalizeInsightFilter("nonsense")).toBe("all");
    expect(normalizeInsightFilter(null)).toBe("all");
    expect(insightKindLabel("late")).toBe("Late orders");
  });

  it("words the trend", () => {
    expect(trendText(null)).toBe("new this week");
    expect(trendText(0.4)).toBe("flat on last week");
    expect(trendText(41.2)).toBe("up 41% on last week");
    expect(trendText(-20)).toBe("down 20% on last week");
  });

  it("hands on only to pages that already exist", () => {
    expect(isKnownDestination("/products/fit/104")).toBe(true);
    expect(isKnownDestination("/warehouse")).toBe(true);
    expect(isKnownDestination("/spotlight?tab=inbound")).toBe(true);
    expect(isKnownDestination("/customer-support/new-thing")).toBe(false);
  });
});
