import { describe, expect, it } from "vitest";

import {
  allocationLocations,
  filterAllocation,
  filterCashRelease,
  matchesQuery,
} from "@/lib/planning-filters";
import type { AllocationPlan, CashReleasePlan } from "@/types/planning";

function cashItem(id: number, title: string, bucket: "180+d" | "90-180d", value: number) {
  return {
    product_id: id,
    title,
    bucket,
    tier: "deep",
    discount_pct: 50,
    stock: 10,
    stock_value: value,
    expected_cash: value / 2,
    margin_given_up: value / 2,
    days_since_last_sale: 200,
  };
}

const CASH: CashReleasePlan = {
  generated_at: "2026-09-08T00:00:00Z",
  horizon_weeks: 6,
  basis: "estimate",
  totals: { products: 3, stock_value: 600, expected_cash: 300, margin_given_up: 300 },
  weeks: [
    {
      week: 1, starts_on: "2026-09-14", products: 2,
      stock_value: 400, expected_cash: 200, margin_given_up: 200,
      items: [cashItem(1, "RIB DOLMAN V TEE-TAN", "180+d", 300),
              cashItem(2, "Center Ruffle Dress", "90-180d", 100)],
    },
    {
      week: 2, starts_on: "2026-09-21", products: 1,
      stock_value: 200, expected_cash: 100, margin_given_up: 100,
      items: [cashItem(3, "PLAID PLEAT DRESS", "180+d", 200)],
    },
  ],
};

describe("matchesQuery", () => {
  it("is case- and whitespace-insensitive", () => {
    expect(matchesQuery("RIB DOLMAN V TEE", "  dolman ")).toBe(true);
  });

  it("an empty query matches everything", () => {
    expect(matchesQuery("anything", "")).toBe(true);
    expect(matchesQuery("anything", "   ")).toBe(true);
  });

  it("does not match an absent term", () => {
    expect(matchesQuery("RIB DOLMAN", "skirt")).toBe(false);
  });
});

describe("filterCashRelease", () => {
  it("returns everything when nothing is filtered", () => {
    const out = filterCashRelease(CASH, { query: "", bucket: "all", week: "all" });
    expect(out.weeks).toHaveLength(2);
    expect(out.totals.products).toBe(3);
  });

  it("RECOMPUTES totals from what survived, so the cards always add up", () => {
    const out = filterCashRelease(CASH, { query: "", bucket: "180+d", week: "all" });
    expect(out.totals.products).toBe(2);
    expect(out.totals.stock_value).toBe(500);
    expect(out.totals.expected_cash).toBe(250);
    // the invariant the page depends on
    expect(out.totals.expected_cash + out.totals.margin_given_up).toBe(
      out.totals.stock_value,
    );
  });

  it("recomputes each week's own totals too", () => {
    const out = filterCashRelease(CASH, { query: "", bucket: "180+d", week: "all" });
    const week1 = out.weeks.find((w) => w.week === 1);
    expect(week1?.products).toBe(1);
    expect(week1?.stock_value).toBe(300);
  });

  it("filters by week", () => {
    const out = filterCashRelease(CASH, { query: "", bucket: "all", week: "2" });
    expect(out.weeks).toHaveLength(1);
    expect(out.weeks[0].week).toBe(2);
  });

  it("filters by product name", () => {
    const out = filterCashRelease(CASH, { query: "pleat", bucket: "all", week: "all" });
    expect(out.totals.products).toBe(1);
    expect(out.weeks[0].items[0].title).toBe("PLAID PLEAT DRESS");
  });

  it("drops a week entirely when nothing in it survives", () => {
    const out = filterCashRelease(CASH, { query: "pleat", bucket: "all", week: "all" });
    expect(out.weeks).toHaveLength(1);
  });

  it("returns zeroed totals when nothing matches, never stale ones", () => {
    const out = filterCashRelease(CASH, { query: "zzz", bucket: "all", week: "all" });
    expect(out.weeks).toEqual([]);
    expect(out.totals).toEqual({
      products: 0, stock_value: 0, expected_cash: 0, margin_given_up: 0,
    });
  });
});

function allocItem(id: number, title: string, units: number, value: number) {
  return {
    product_id: id, title,
    source_stock: 20, destination_units_sold: units, destination_stock: 0,
    move_units: units, unit_price: value / units, expected_value: value,
    days_since_last_sale_at_source: 14,
  };
}

const ALLOC: AllocationPlan = {
  generated_at: "2026-09-08T00:00:00Z",
  basis: "capped, gross",
  totals: { runs: 2, moves: 3, units: 12, expected_value: 1200 },
  runs: [
    {
      run_key: "a", source_location_id: 5, source_location_name: "Pomona",
      destination_location_id: 3, destination_location_name: "Lawrence",
      units: 8, expected_value: 800, already_sent_at: null,
      items: [allocItem(1, "MYLAR DOT DRESS", 5, 500), allocItem(2, "V YOKE SKIRT", 3, 300)],
    },
    {
      run_key: "b", source_location_id: 4, source_location_name: "Jackson",
      destination_location_id: 3, destination_location_name: "Lawrence",
      units: 4, expected_value: 400, already_sent_at: null,
      items: [allocItem(3, "GRACEN SKIRT", 4, 400)],
    },
  ],
};

describe("filterAllocation", () => {
  it("returns everything when nothing is filtered", () => {
    const out = filterAllocation(ALLOC, { query: "", source: "all", destination: "all" });
    expect(out.runs).toHaveLength(2);
    expect(out.totals.expected_value).toBe(1200);
  });

  it("filters by source location and recomputes totals", () => {
    const out = filterAllocation(ALLOC, { query: "", source: "5", destination: "all" });
    expect(out.runs).toHaveLength(1);
    expect(out.totals.expected_value).toBe(800);
    expect(out.totals.units).toBe(8);
    expect(out.totals.moves).toBe(2);
  });

  it("filters by destination location", () => {
    const out = filterAllocation(ALLOC, { query: "", source: "all", destination: "3" });
    expect(out.runs).toHaveLength(2);
  });

  it("filters by product and recomputes the run's own totals", () => {
    const out = filterAllocation(ALLOC, { query: "yoke", source: "all", destination: "all" });
    expect(out.runs).toHaveLength(1);
    expect(out.runs[0].items).toHaveLength(1);
    expect(out.runs[0].expected_value).toBe(300);
    expect(out.runs[0].units).toBe(3);
  });

  it("returns zeroed totals when nothing matches", () => {
    const out = filterAllocation(ALLOC, { query: "zzz", source: "all", destination: "all" });
    expect(out.runs).toEqual([]);
    expect(out.totals).toEqual({ runs: 0, moves: 0, units: 0, expected_value: 0 });
  });
});

describe("allocationLocations", () => {
  it("lists distinct sources and destinations, alphabetically", () => {
    const { sources, destinations } = allocationLocations(ALLOC);
    expect(sources.map((s) => s.name)).toEqual(["Jackson", "Pomona"]);
    expect(destinations.map((d) => d.name)).toEqual(["Lawrence"]);
  });
});
