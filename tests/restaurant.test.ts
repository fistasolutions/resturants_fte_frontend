/** Frontend SPEC-377 — the restaurant screens' pure half: periods, filters, tabs, labels, tiles,
 * franchise role permissions and the snake→camel adapter. */
import { describe, expect, it } from "vitest";

import { accessFor } from "@/lib/disclosure";
import { filterQuery, restaurantPaths } from "@/lib/queries/restaurant";
import {
  FRANCHISE_ROLE_PERMISSIONS,
  HQ_ONLY_PERMISSIONS,
  MENU_CLASSES,
  filtersFromParams,
  heat,
  labelOf,
  normalizeMenuClass,
  normalizeNetworkTab,
  normalizeOperationsTab,
  normalizeRoyaltyTab,
  normalizeStatementStatus,
  overviewTiles,
  resolvePeriod,
  scopeLabel,
  share,
  statementActions,
  SOURCE_LABELS,
  withParams,
} from "@/lib/restaurant";
import { fromApi, toApi } from "@/lib/restaurant-api";
import type { Kpi, KpiKey, NetworkOverview } from "@/types/restaurant";

describe("periods", () => {
  it("defaults to the last 7 complete days", () => {
    expect(resolvePeriod({}, "2026-10-15")).toEqual({ from: "2026-10-08", to: "2026-10-14", range: "7d" });
  });

  it("knows the 28 and 90 day presets", () => {
    expect(resolvePeriod({ range: "28d" }, "2026-10-15")).toEqual({ from: "2026-09-17", to: "2026-10-14", range: "28d" });
    expect(resolvePeriod({ range: "90d" }, "2026-03-01").from).toBe("2025-12-01");
  });

  it("takes an explicit period and refuses a backwards or malformed one", () => {
    expect(resolvePeriod({ from: "2026-10-01", to: "2026-10-05" }, "2026-10-15").range).toBe("custom");
    expect(resolvePeriod({ from: "2026-10-05", to: "2026-10-01" }, "2026-10-15").range).toBe("7d");
    expect(resolvePeriod({ from: "Oct 1", to: "2026-10-05" }, "2026-10-15").range).toBe("7d");
  });

  it("reads the filters from the URL", () => {
    const f = filtersFromParams({ franchisee: "4", region: "x", branch: "0", target: "45" }, "2026-10-15");
    expect(f).toMatchObject({ franchiseeId: 4, regionId: null, branchId: null, target: 45 });
    expect(filtersFromParams({ target: "500" }, "2026-10-15").target).toBeNull();
  });
});

describe("links keep the period", () => {
  it("applies changes and drops nulls", () => {
    expect(withParams("/network", { range: "28d", tab: "branches" }, { tab: null, region: "3" })).toBe(
      "/network?range=28d&region=3",
    );
    expect(withParams("/menu", {}, {})).toBe("/menu");
  });
});

describe("tabs", () => {
  it("fall back to the first tab", () => {
    expect(normalizeNetworkTab("access")).toBe("access");
    expect(normalizeNetworkTab("nope")).toBe("overview");
    expect(normalizeOperationsTab(undefined)).toBe("speed");
    expect(normalizeMenuClass("puzzle")).toBe("puzzle");
    expect(normalizeMenuClass("cat")).toBeNull();
  });

  it("list the menu groups in reading order", () => {
    expect(MENU_CLASSES.map((c) => c.key)).toEqual(["star", "plowhorse", "puzzle", "dog", "no_cost"]);
  });
});

describe("labels and figures", () => {
  it("formats shares and labels unknown keys readably", () => {
    expect(share(0.1234)).toBe("12.3%");
    expect(share(null)).toBe("—");
    expect(labelOf(SOURCE_LABELS, "ubereats")).toBe("Uber Eats");
    expect(labelOf(SOURCE_LABELS, "drive_thru")).toBe("Drive thru");
  });

  it("scales the heat grid to its busiest cell", () => {
    expect(heat(50, 200)).toBe(0.25);
    expect(heat(0, 200)).toBe(0);
    expect(heat(10, 0)).toBe(0);
  });

  it("names a member's scope", () => {
    expect(scopeLabel(null, null)).toBe("Whole network");
    expect(scopeLabel("North Pizza LLC", null)).toBe("North Pizza LLC");
    expect(scopeLabel("North Pizza LLC", [1])).toBe("1 branch of North Pizza LLC");
    expect(scopeLabel("North Pizza LLC", [1, 2])).toBe("2 branches of North Pizza LLC");
  });
});

describe("KPI tiles", () => {
  const kpi = (value: number | null, change: number | null = null): Kpi => ({ value, previous: change == null ? null : 1, change });
  const kpis = {
    net_sales: kpi(1310, 0.25),
    transactions: kpi(40),
    average_ticket: kpi(32.75),
    guests: kpi(20),
    labor_pct: kpi(0.28, 0.1),
    food_cost_pct: kpi(null),
    prime_cost_pct: kpi(null),
    on_time_rate: kpi(0.8),
    third_party_share: kpi(0.2),
    discount_rate: kpi(0.05),
  } as Record<KpiKey, Kpi>;
  const overview = { kpis } as unknown as NetworkOverview;

  it("builds ten tiles with the change as a percent and costs inverted", () => {
    const tiles = overviewTiles(overview, "vs Oct 1 – Oct 7");
    expect(tiles).toHaveLength(10);
    const net = tiles.find((t) => t.key === "net_sales")!;
    expect(net.delta).toBe(25);
    expect(net.invertDelta).toBe(false);
    expect(net.sub).toContain("vs Oct 1 – Oct 7");
    const labor = tiles.find((t) => t.key === "labor_pct")!;
    expect(labor.value).toBe("28%");
    expect(labor.invertDelta).toBe(true);
    expect(tiles.find((t) => t.key === "food_cost_pct")!.value).toBe("—");
  });
});

describe("franchise roles", () => {
  it("never offer a head-office permission", () => {
    for (const permission of FRANCHISE_ROLE_PERMISSIONS) expect(HQ_ONLY_PERMISSIONS.has(permission)).toBe(false);
  });
});

describe("the adapter", () => {
  it("camel-cases fields but keeps KPI keys, column maps and preview rows as sent", () => {
    const view = fromApi<Record<string, unknown>>({
      previous_period: { from: "a" },
      kpis: { net_sales: { value: 1, previous: 2, change: null } },
      counts: { no_cost: 1 },
      columns: { external_ref: "Order #" },
      preview: [{ branch_code: "101" }],
      top: [{ branch_id: 3, franchisee_name: "F" }],
    });
    expect(view).toEqual({
      previousPeriod: { from: "a" },
      kpis: { net_sales: { value: 1, previous: 2, change: null } },
      counts: { no_cost: 1 },
      columns: { external_ref: "Order #" },
      preview: [{ branch_code: "101" }],
      top: [{ branchId: 3, franchiseeName: "F" }],
    });
  });

  it("snake-cases a write's body and drops undefined fields", () => {
    expect(toApi({ brandName: "B", ianaTimezone: null, notes: undefined })).toEqual({ brand_name: "B", iana_timezone: null });
  });
});

describe("paths", () => {
  it("carry every filter that is set", () => {
    expect(filterQuery({ from: "2026-10-01", to: "2026-10-07", franchiseeId: 2, target: 45 })).toBe(
      "from=2026-10-01&to=2026-10-07&franchisee_id=2&target=45",
    );
    expect(restaurantPaths.branches({ regionId: 3, q: "main" })).toBe("/restaurant/branches?region_id=3&q=main");
    expect(restaurantPaths.branches()).toBe("/restaurant/branches");
    expect(restaurantPaths.league({ from: "a", to: "b", branchId: 9 })).toBe("/restaurant/league?from=a&to=b");
  });
});

describe("the landing page", () => {
  it("is never locked, so a restaurant brand's redirect to /network runs", () => {
    const nav = [{ key: "dashboard", visible: false, ready: true, reason: "feature" as const }];
    expect(accessFor("/", nav).allowed).toBe(true);
    expect(accessFor("/dashboard", nav).allowed).toBe(false);
  });
});

describe("royalty billing (SPEC-378)", () => {
  it("offers only the moves the backend allows", () => {
    expect(statementActions("draft")).toEqual(["issue", "void"]);
    expect(statementActions("issued")).toEqual(["paid", "void"]);
    expect(statementActions("paid")).toEqual([]);
    expect(statementActions("void")).toEqual([]);
  });

  it("normalizes the tab and the status filter", () => {
    expect(normalizeRoyaltyTab("statements")).toBe("statements");
    expect(normalizeRoyaltyTab("x")).toBe("period");
    expect(normalizeStatementStatus("paid")).toBe("paid");
    expect(normalizeStatementStatus("lost")).toBeNull();
  });
});
