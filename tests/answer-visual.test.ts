import { describe, expect, it } from "vitest";

import {
  axisLabel,
  chartCaption,
  chartRows,
  dateLabel,
  formatAxis,
  formatValue,
  readAnswerView,
  takeaway,
  writeAnswerView,
} from "@/lib/answer-visual";
import type { AnswerVisual } from "@/types/chat";

const BAR: AnswerVisual = {
  kind: "bar",
  title: "Top products by revenue",
  unit: "currency",
  metric: "revenue",
  tool: "get_top_products",
  series: [
    {
      name: "Revenue",
      points: [
        { label: "E-Gift Card", value: 33528.86 },
        { label: "Katie Dress - Geo Boarder", value: 12984.3 },
      ],
    },
  ],
};
const COMPARE: AnswerVisual = {
  kind: "compare",
  title: "This period vs previous",
  unit: "currency",
  metric: "gross_revenue",
  tool: "get_revenue_summary",
  series: [
    { name: "This period", points: [{ label: "Gross revenue", value: 1036353.2 }, { label: "Net revenue", value: 826838 }] },
    { name: "Previous", points: [{ label: "Gross revenue", value: 1325701.12 }, { label: "Net revenue", value: 1110245.34 }] },
  ],
};

describe("takeaway", () => {
  it("keeps the first real paragraph and skips headings, rules and tables", () => {
    expect(takeaway("## Summary\n\n**Revenue is up 8%** this week.\n\n| a | b |\n|---|---|\n\nMore.")).toBe(
      "**Revenue is up 8%** this week.",
    );
    expect(takeaway("| Metric | Value |\n|---|---|\n\nOrders fell.")).toBe("Orders fell.");
    expect(takeaway("")).toBe("");
  });
});

describe("formatting", () => {
  it("formats by unit, full and short", () => {
    expect(formatValue("currency", 33528.86)).toBe("$33,528.86");
    expect(formatValue("percent", 12.5)).toBe("12.5%");
    expect(formatValue("number", 2421)).toBe("2,421");
    expect(formatAxis("currency", 33528.86)).toMatch(/^\$33\.5K$/);
    expect(formatAxis("number", 2421)).toBe("2.4k");
    expect(formatAxis("number", 57)).toBe("57");
    expect(formatAxis("percent", 12.4)).toBe("12%");
  });

  it("shortens axis labels and turns ISO days into short dates", () => {
    expect(axisLabel("E-Gift Card")).toBe("E-Gift Card");
    expect(axisLabel("Collared Ruched Back Long Sleeve Shirtdress")).toBe("Collared Ruched Back…");
    expect(dateLabel("2026-09-10")).toBe("Sep 10");
    expect(dateLabel("Point of Sale")).toBe("Point of Sale");
  });
});

describe("chartRows / chartCaption", () => {
  it("builds one row per label with a column per series", () => {
    expect(chartRows(BAR)).toEqual([
      { label: "E-Gift Card", s0: 33528.86 },
      { label: "Katie Dress - Geo Boarder", s0: 12984.3 },
    ]);
    expect(chartRows(COMPARE)).toEqual([
      { label: "Gross revenue", s0: 1036353.2, s1: 1325701.12 },
      { label: "Net revenue", s0: 826838, s1: 1110245.34 },
    ]);
  });

  it("names the source under the chart", () => {
    expect(chartCaption(BAR)).toBe("From get_top_products · top 2 by revenue");
    expect(chartCaption(COMPARE)).toBe("From get_revenue_summary · this period vs previous");
  });
});

describe("answer view preference", () => {
  it("defaults to text and tolerates no storage (node)", () => {
    expect(readAnswerView()).toBe("text");
    expect(() => writeAnswerView("chart")).not.toThrow();
  });
});
