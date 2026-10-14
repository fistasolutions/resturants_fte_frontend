import { describe, expect, it } from "vitest";

import { MARGIN_PENDING, buildReportStrip, comparisonLabel } from "@/lib/report-strip";
import type { ReportMetrics } from "@/types/reports";

const METRICS: ReportMetrics = {
  sales: {
    gross_revenue: 119772,
    net_revenue: 115281.56,
    orders: 370,
    aov: 323.71,
    refunds_total: 4490.44,
    change_pct: { gross_revenue: 4725.8, orders: 2746.2, aov: 69.6 },
  },
  margin: {
    gross_revenue: 119772,
    cost_known_revenue: 103842,
    cogs: 28700,
    product_margin: 75142,
    margin_pct: 72.4,
    coverage_pct: 86.7,
  },
  refunds: { count: 38, total: 4490.44, pct_of_revenue: 3.7 },
};

describe("buildReportStrip (SPEC-288)", () => {
  it("lays the six figures out in reading order with their deltas and subs", () => {
    const tiles = buildReportStrip(METRICS);
    expect(tiles.map((t) => t.key)).toEqual([
      "gross_revenue",
      "net_revenue",
      "product_margin",
      "orders",
      "aov",
      "refunds",
    ]);
    expect(tiles[0]).toMatchObject({ value: "$119,772.00", delta: 4725.8, sub: "vs prior day" });
    expect(tiles[1]).toMatchObject({ value: "$115,281.56", delta: null, sub: "after refunds" });
    expect(tiles[2]).toMatchObject({ value: "72.4%", sub: "on 86.7% of revenue" });
    expect(tiles[3]).toMatchObject({ value: "370", delta: 2746.2 });
    expect(tiles[4]).toMatchObject({ value: "$323.71", delta: 69.6 });
    expect(tiles[5]).toMatchObject({
      value: "3.7%",
      invertDelta: true,
      sub: "38 refunds · $4,490.44",
    });
  });

  it("names the comparison by period", () => {
    expect(comparisonLabel("weekly")).toBe("vs prior 7 days");
    expect(comparisonLabel("monthly")).toBe("vs prior 30 days");
    expect(buildReportStrip(METRICS, "weekly")[0].sub).toBe("vs prior 7 days");
  });

  it("shows the margin as pending, never a zero, when costs are unknown", () => {
    const tile = buildReportStrip({
      ...METRICS,
      margin: { ...METRICS.margin!, margin_pct: null, product_margin: null },
    })[2];
    expect(tile.value).toBe("—");
    expect(tile.sub).toBe(MARGIN_PENDING);
    expect(buildReportStrip({ sales: METRICS.sales })[2].sub).toBe(MARGIN_PENDING);
  });

  it("falls back to the refund total when the payload has no refund block", () => {
    const tile = buildReportStrip({ sales: METRICS.sales })[5];
    expect(tile).toMatchObject({ value: "$4,490.44", sub: "of gross revenue" });
  });

  it("leaves the sub empty when there is no baseline — never a fake 0%", () => {
    const tiles = buildReportStrip({
      sales: { ...METRICS.sales!, change_pct: { gross_revenue: null, orders: null, aov: null } },
    });
    expect(tiles[0]).toMatchObject({ delta: null, sub: "" });
    expect(buildReportStrip({ sales: { ...METRICS.sales!, change_pct: undefined } })[3].sub).toBe("");
  });

  it("is empty for a payload without sales", () => {
    expect(buildReportStrip({})).toEqual([]);
  });
});
