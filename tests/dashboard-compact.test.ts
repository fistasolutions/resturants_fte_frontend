import { describe, expect, it } from "vitest";

import {
  buildDashboardAlerts,
  misplacedCaption,
  unfulfilledCaption,
} from "@/lib/dashboard-alerts";
import { buildDashboardStrip, formatKpiValue, tileComparisonLabel } from "@/lib/dashboard-strip";
import { MOVERS_LIMIT, TOP_PRODUCTS_LIMIT, foldItems, showMoreLabel } from "@/lib/fold";
import {
  LOCATION_ROWS_VISIBLE,
  locationKey,
  locationReviewHref,
  locationsScroll,
  locationsSummary,
  splitLocations,
} from "@/lib/location-table";
import type { AlertsSummary, Kpi } from "@/types/analytics";
import type { DeadInventoryAlerts } from "@/types/analysis";
import type { LocationKpi } from "@/types/dashboard";

const KPIS: Kpi[] = [
  { id: "revenue", label: "Revenue", value: 1261468.22, changePercent: 2.7, format: "currency" },
  { id: "orders", label: "Orders", value: 4019, changePercent: 18.4, format: "number" },
  { id: "aov", label: "Avg. order value", value: 313.88, changePercent: -13.3, format: "currency" },
  {
    id: "returning_customer_rate",
    label: "Returning customers",
    value: 89.3,
    changePercent: -1.5,
    format: "percent",
  },
  { id: "new_customers", label: "New customers", value: 348, changePercent: null, format: "number" },
];

const NET = { grossSales: 1309734.41, discounts: 98208.21, returns: 221624.12, netSales: 989902.08 };

describe("buildDashboardStrip", () => {
  it("puts net sales right after revenue and keeps the KPI links", () => {
    const tiles = buildDashboardStrip(KPIS, NET, "vs Aug 30 – Sep 5, 2026", "2026-09-12");
    expect(tiles.map((t) => t.key)).toEqual([
      "revenue",
      "net_sales",
      "orders",
      "aov",
      "returning_customer_rate",
      "new_customers",
    ]);
    expect(tiles[0]).toMatchObject({
      value: "$1,261,468.22",
      delta: 2.7,
      sub: "vs Aug 30 – Sep 5",
      href: undefined,
    });
    expect(tiles[1]).toMatchObject({ value: "$989,902.08", delta: null, sub: "after discounts & returns" });
    expect(tiles[2].href).toBe("/orders");
    expect(tiles[5].href).toBe("/customers");
  });

  it("has five tiles when the backend serves no net sales", () => {
    expect(buildDashboardStrip(KPIS, null, "vs x")).toHaveLength(5);
  });

  it("never shows a fake delta — no baseline or comparison off means no delta and no label", () => {
    const [, , , , , fresh] = buildDashboardStrip(KPIS, NET, "vs x");
    expect(fresh.delta).toBeNull();
    expect(fresh.sub).toBe("");
    const off = buildDashboardStrip(KPIS, NET, null);
    expect(off[0].delta).toBeNull();
  });

  it("drops only the current year from the tile's comparison label", () => {
    expect(tileComparisonLabel("vs Aug 30 – Sep 5, 2026", "2026-09-12")).toBe("vs Aug 30 – Sep 5");
    expect(tileComparisonLabel("vs Sep 11, 2026 (same time)", "2026-09-12")).toBe("vs Sep 11 (same time)");
    expect(tileComparisonLabel("vs Sep 5 – 11, 2025", "2026-09-12")).toBe("vs Sep 5 – 11, 2025");
    expect(tileComparisonLabel("vs Dec 28, 2025 – Jan 3, 2026", "2026-09-12")).toBe("vs Dec 28, 2025 – Jan 3");
  });

  it("formats each KPI by its declared format", () => {
    expect(formatKpiValue(KPIS[0])).toBe("$1,261,468.22");
    expect(formatKpiValue(KPIS[1])).toBe("4,019");
    expect(formatKpiValue(KPIS[3])).toBe("89.3%");
  });
});

const ALERTS: AlertsSummary = {
  lowStockVariants: 21866,
  outOfStockVariants: 0,
  highDiscountProducts: 0,
  refundsAmount: 0,
  refundsCount: 0,
  lowStockRevenueAtRisk: 8034050.8,
  deadStockProducts: 1465,
  deadStockValue: 1924879.18,
  returnsSpikeProduct: "ANDREA JUMPER F6",
  returnsSpikeProductId: 1,
  returnsSpikeRate: 100,
  unfulfilledValue: 66487.88,
  unfulfilledCount: 267,
  unfulfilledSent: false,
  unfulfilledSentAt: null,
};

const MISPLACED: DeadInventoryAlerts = {
  generated_at: "2026-09-12T00:00:00Z",
  window_days: 90,
  summary: { styles_flagged: 1309, total_value: 2871183.3, locations_affected: 3 },
  alerts: [],
};

describe("buildDashboardAlerts", () => {
  it("builds the five alerts in page order with their hrefs", () => {
    const tiles = buildDashboardAlerts(ALERTS, MISPLACED);
    expect(tiles.map((t) => t.key)).toEqual([
      "unfulfilled",
      "low_stock",
      "dead_stock",
      "returns_spike",
      "misplaced",
    ]);
    expect(tiles[0]).toMatchObject({
      tone: "hi",
      value: "$66,487.88",
      caption: "267 orders unshipped over 48h",
      href: "/orders?fulfillment=unfulfilled&age=48_plus",
      allClear: false,
    });
    expect(tiles[1].caption).toBe("21,866 variants at risk of stockout");
    expect(tiles[2].caption).toBe("1,465 products, 0 sales in 90 days");
    expect(tiles[3]).toMatchObject({ tone: "ai", value: "ANDREA JUMPER F6", caption: "100% return rate (30 days)" });
    expect(tiles[4]).toMatchObject({
      value: "$2,871,183.30",
      caption: "1,309 styles sitting idle across 3 locations, selling elsewhere",
      href: "/inventory/dead-inventory-alerts",
    });
  });

  it("pluralises and reports a sent overdue list", () => {
    expect(unfulfilledCaption({ ...ALERTS, unfulfilledCount: 1 })).toBe("1 order unshipped over 48h");
    expect(
      unfulfilledCaption({
        ...ALERTS,
        unfulfilledSent: true,
        unfulfilledSentAt: "2026-09-12T13:05:00Z",
      }),
    ).toMatch(/^267 orders · ✓ sent to managers, /);
    expect(
      misplacedCaption({ ...MISPLACED, summary: { styles_flagged: 1, total_value: 5, locations_affected: 1 } }),
    ).toBe("1 style sitting idle across 1 location, selling elsewhere");
  });

  it("reads all-clear when there is nothing to report, and degrades alone when misplaced is missing", () => {
    const tiles = buildDashboardAlerts(
      {
        ...ALERTS,
        unfulfilledCount: 0,
        lowStockRevenueAtRisk: 0,
        deadStockProducts: 0,
        returnsSpikeProduct: null,
        returnsSpikeRate: null,
      },
      null,
    );
    expect(tiles.every((t) => t.allClear)).toBe(true);
    expect(tiles[3].caption).toBe("No spike detected");
    expect(tiles[4]).toMatchObject({ value: "$0.00", caption: "No misplaced inventory detected" });
    expect(tiles.map((t) => t.allClearMessage)).toEqual([
      "Nothing unfulfilled over 48h",
      "All variants well stocked",
      "All inventory is moving",
      "No return spikes detected",
      "Nothing sitting on the wrong shelf",
    ]);
  });
});

function loc(over: Partial<LocationKpi>): LocationKpi {
  return {
    location_id: 1,
    channel: null,
    name: "Jackson",
    revenue: 100,
    orders: 2,
    aov: 50,
    new_customers: 1,
    returning_customers: 1,
    unfulfilled: 0,
    top_product: null,
    top_product_revenue: null,
    revenue_series: [],
    ...over,
  };
}

describe("location table", () => {
  it("splits selling from quiet locations", () => {
    const { selling, quiet } = splitLocations([
      loc({ name: "Jackson" }),
      loc({ name: "MILL warehouse", location_id: 9, revenue: 0, orders: 0 }),
      loc({ name: "Online Store", location_id: null, channel: "Online Store", revenue: 0, orders: 1 }),
    ]);
    expect(selling.map((l) => l.name)).toEqual(["Jackson", "Online Store"]);
    expect(quiet.map((l) => l.name)).toEqual(["MILL warehouse"]);
    expect(locationsSummary(2, 1)).toBe("2 selling · 1 quiet");
    expect(locationsSummary(2, 0)).toBe("2 selling");
  });

  it("scrolls only past four selling locations", () => {
    expect(LOCATION_ROWS_VISIBLE).toBe(4);
    expect(locationsScroll(4)).toBe(false);
    expect(locationsScroll(5)).toBe(true);
  });

  it("links a POS location to its filtered review page and a channel to the unfiltered one", () => {
    expect(locationReviewHref(loc({ location_id: 7 }))).toBe("/orders/review?location=7");
    expect(locationReviewHref(loc({ location_id: null, channel: "Draft Orders" }))).toBe("/orders/review");
    expect(locationKey(loc({ location_id: 7 }))).toBe("7");
    expect(locationKey(loc({ location_id: null, channel: "Draft Orders" }))).toBe("channel:Draft Orders");
  });
});

describe("fold", () => {
  it("keeps the first n and folds the rest", () => {
    const { shown, hidden } = foldItems([1, 2, 3, 4, 5, 6, 7], MOVERS_LIMIT);
    expect(shown).toEqual([1, 2, 3, 4, 5]);
    expect(hidden).toEqual([6, 7]);
    expect(foldItems([1, 2], TOP_PRODUCTS_LIMIT).hidden).toEqual([]);
  });

  it("labels the button", () => {
    expect(showMoreLabel(5, "product")).toBe("Show 5 more products");
    expect(showMoreLabel(1, "product")).toBe("Show 1 more product");
  });
});
