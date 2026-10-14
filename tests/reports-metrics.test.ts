/** SPEC-106 — report metrics contract for the new Same-Store Sales + Top-10
 * Styles sections (backend SPEC-105). Type-shape guards as runtime assertions
 * (no jsdom runner; the view is verified via the spec's manual checklist). */

import { describe, expect, it } from "vitest";

import type { ReportMetrics } from "@/types/reports";

function makeMetrics(overrides: Partial<ReportMetrics> = {}): ReportMetrics {
  return {
    top_styles: [
      { product_id: 1, title: "Everyday Hoodie", units: 120, revenue: 6600 },
      { product_id: 2, title: "Wide-Leg Denim", units: 80, revenue: 7200 },
    ],
    same_store_sales: {
      current_period: { start: "2026-08-04", end: "2026-08-11" },
      previous_period: { start: "2026-07-28", end: "2026-08-04" },
      locations: [
        {
          location_id: 801,
          location: "Jackson",
          current_revenue: 300,
          previous_revenue: 200,
          current_orders: 2,
          previous_orders: 1,
          change_pct: 50,
        },
      ],
      comparable_total: {
        store_count: 1,
        current_revenue: 300,
        previous_revenue: 200,
        change_pct: 50,
      },
    },
    ...overrides,
  };
}

describe("ReportMetrics — Top 10 styles (D-19)", () => {
  it("is capped in intent and revenue-shaped", () => {
    const styles = makeMetrics().top_styles!;
    expect(styles.length).toBeLessThanOrEqual(10);
    for (const s of styles) {
      expect(typeof s.product_id).toBe("number");
      expect(typeof s.units).toBe("number");
      expect(typeof s.revenue).toBe("number");
    }
  });
});

describe("ReportMetrics — Same-store sales (D-09)", () => {
  it("carries comparable locations and a comparable total", () => {
    const sss = makeMetrics().same_store_sales!;
    expect(sss.locations.length).toBe(sss.comparable_total.store_count);
    expect(sss.comparable_total.current_revenue).toBe(300);
  });

  it("change_pct may be a number or null", () => {
    const sss = makeMetrics({
      same_store_sales: {
        current_period: { start: "a", end: "b" },
        previous_period: { start: "c", end: "d" },
        locations: [],
        comparable_total: {
          store_count: 0,
          current_revenue: 0,
          previous_revenue: 0,
          change_pct: null,
        },
      },
    }).same_store_sales!;
    expect(sss.comparable_total.change_pct).toBeNull();
  });
});
