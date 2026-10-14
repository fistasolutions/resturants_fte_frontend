import { describe, expect, it } from "vitest";

import { adaptBrandVerdicts, type ApiBrandVerdicts } from "@/lib/adapters";
import { marginCell, sellThroughCell, summaryTiles, verdictBadgeClass } from "@/lib/brand-verdicts";
import type { BrandRow, BrandVerdictsSummary } from "@/types/analysis";

function row(over: Partial<BrandRow> = {}): BrandRow {
  return {
    vendor: "MELI",
    products: 10,
    units: 100,
    revenue: 5000,
    orders: 80,
    unitsReturned: 12,
    refundValue: 400,
    returnRate: 0.12,
    stockUnits: 150,
    stockValue: 6000,
    sellThrough: 0.4,
    deadProducts: 2,
    deadStockValue: 300,
    productMargin: 2000,
    marginPct: 45.5,
    coveragePct: 88.2,
    verdict: "buy_less",
    verdictLabel: "Buy less",
    verdictTone: "warn",
    why: "Sell-through 40% — over-bought",
    ...over,
  };
}

const SUMMARY: BrandVerdictsSummary = {
  vendors: 146,
  withVerdict: 91,
  stop: 12,
  buyLess: 43,
  buyMore: 3,
  hold: 33,
  tooFewSales: 55,
  returnsSource: "Shopify refund lines",
  marginMinCoveragePct: 50,
};

describe("verdictBadgeClass", () => {
  it("maps every tone to semantic tokens only", () => {
    expect(verdictBadgeClass("bad")).toBe("bg-destructive/10 text-destructive");
    expect(verdictBadgeClass("warn")).toBe("bg-warning/10 text-warning");
    expect(verdictBadgeClass("good")).toBe("bg-success/10 text-success");
    expect(verdictBadgeClass("neutral")).toBe("bg-muted text-foreground");
    expect(verdictBadgeClass("muted")).toBe("bg-muted text-muted-foreground");
  });
});

describe("summaryTiles", () => {
  it("is total first, then every verdict in the backend's order, zeros kept", () => {
    const tiles = summaryTiles({ ...SUMMARY, buyMore: 0 });
    expect(tiles.map((t) => t.key)).toEqual([
      "vendors", "stop", "buy_less", "buy_more", "hold", "too_few_sales",
    ]);
    expect(tiles[0]).toEqual({ key: "vendors", label: "Brands", value: "146", tone: "plain" });
    expect(tiles[3]).toEqual({ key: "buy_more", label: "Buy more", value: "0", tone: "good" });
  });
});

describe("marginCell", () => {
  it("shows the margin with its coverage", () => {
    expect(marginCell(row())).toEqual({ text: "45.5%", sub: "88.2% costed", muted: false });
  });

  it("never shows a number without cost data", () => {
    expect(marginCell(row({ marginPct: null, productMargin: null, coveragePct: 0 }))).toEqual({
      text: "No cost data",
      sub: null,
      muted: true,
    });
  });
});

describe("sellThroughCell", () => {
  it("formats the ratio as a percentage and dashes the undefined case", () => {
    expect(sellThroughCell(row())).toBe("40%");
    expect(sellThroughCell(row({ sellThrough: null }))).toBe("—");
  });
});

describe("adaptBrandVerdicts", () => {
  it("maps snake_case to camelCase and keeps nulls null", () => {
    const raw: ApiBrandVerdicts = {
      period: { key: "90d", start: "2026-06-16", end: "2026-09-14" },
      summary: {
        vendors: 1, with_verdict: 0, stop: 0, buy_less: 0, buy_more: 0, hold: 0,
        too_few_sales: 1, returns_source: "Shopify refund lines", margin_min_coverage_pct: 50,
      },
      brands: [{
        vendor: "Quiet Co", products: 1, units: 5, revenue: 200, orders: 5,
        units_returned: 0, refund_value: 0, return_rate: 0, stock_units: 0, stock_value: 0,
        sell_through: null, dead_products: 0, dead_stock_value: 0, product_margin: null,
        margin_pct: null, coverage_pct: 0, verdict: "too_few_sales",
        verdict_label: "Too few sales", verdict_tone: "muted",
        why: "Only 5 units sold in the window — not enough to judge",
      }],
    };
    const data = adaptBrandVerdicts(raw);
    expect(data.summary.tooFewSales).toBe(1);
    expect(data.summary.marginMinCoveragePct).toBe(50);
    expect(data.brands[0]).toMatchObject({
      vendor: "Quiet Co",
      sellThrough: null,
      productMargin: null,
      marginPct: null,
      coveragePct: 0,
      verdict: "too_few_sales",
      verdictTone: "muted",
    });
  });
});
