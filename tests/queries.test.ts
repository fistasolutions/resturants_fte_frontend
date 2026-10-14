/**
 * SPEC-230 — the query definitions are the single source of paths, keys and
 * composition for both transports. These tests pin (a) that every key carries every
 * input and survives a JSON round-trip (server and browser must hash identically),
 * (b) that each loader calls exactly the path the pre-SPEC-230 service called, and
 * (c) that the composed loaders degrade the way the old services did.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiDashboard, ApiWhatChanged } from "@/lib/adapters";
import { analysisPaths, analysisQueries, loadDeadInventoryAlerts } from "@/lib/queries/analysis";
import { briefPaths, briefQueries } from "@/lib/queries/brief";
import {
  comparisonLabel,
  dashboardPaths,
  dashboardQueries,
  loadDashboardData,
  loadWhatChanged,
} from "@/lib/queries/dashboard";
import { storePaths, storeQueries } from "@/lib/queries/store";
import type { ApiGet, QueryDef } from "@/lib/query-def";

/** A transport that records the paths it was asked for and answers from a table. */
function fakeApi(answers: Record<string, unknown>): { api: ApiGet; calls: string[] } {
  const calls: string[] = [];
  const api: ApiGet = async <T,>(path: string): Promise<T> => {
    calls.push(path);
    if (!(path in answers)) throw new Error(`unexpected path ${path}`);
    const answer = answers[path];
    if (answer instanceof Error) throw answer;
    return answer as T;
  };
  return { api, calls };
}

function roundTrips(def: QueryDef<unknown>): unknown[] {
  return JSON.parse(JSON.stringify(def.queryKey)) as unknown[];
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("brief queries", () => {
  const range = { from: "2026-09-01", to: "2026-09-12", compare: "previous_period" as const };

  it("builds the exact paths services/brief.ts used before SPEC-230", () => {
    expect(briefPaths.data()).toBe("/brief");
    expect(briefPaths.data(range)).toBe(
      "/brief?start=2026-09-01&end=2026-09-12&compare=previous_period",
    );
    expect(briefPaths.kpis(range)).toBe(
      "/brief/kpis?start=2026-09-01&end=2026-09-12&compare=previous_period",
    );
    expect(briefPaths.byDate("2026-09-10")).toBe("/brief/2026-09-10");
    expect(briefPaths.history(1, 7)).toBe("/brief/history?page=1&limit=7");
    expect(briefPaths.attention()).toBe("/brief/attention");
  });

  it("keys carry every input and survive a JSON round-trip", () => {
    const live = briefQueries.data();
    const ranged = briefQueries.data(range);
    expect(live.queryKey).toEqual(["brief", "data", null]);
    expect(ranged.queryKey).toEqual(["brief", "data", range]);
    expect(roundTrips(ranged)).toEqual(ranged.queryKey);
    expect(briefQueries.byDate("2026-09-10").queryKey).toEqual(["brief", "by-date", "2026-09-10"]);
    expect(briefQueries.history(2, 10).queryKey).toEqual(["brief", "history", 2, 10]);
    expect(briefQueries.attention().queryKey).toEqual(["brief", "attention"]);
    // A different range is a different cache entry.
    expect(briefQueries.data({ ...range, compare: "none" }).queryKey).not.toEqual(ranged.queryKey);
  });

  it("loaders call their path once through whichever transport they are handed", async () => {
    const { api, calls } = fakeApi({
      "/brief/attention": { items: [] },
      "/brief/history?page=1&limit=7": { items: [], page: 1 },
      "/brief/2026-09-10": { yesterday: { date: "2026-09-09" } },
    });
    await briefQueries.attention().load(api);
    await briefQueries.history(1, 7).load(api);
    await briefQueries.byDate("2026-09-10").load(api);
    expect(calls).toEqual(["/brief/attention", "/brief/history?page=1&limit=7", "/brief/2026-09-10"]);
  });
});

describe("dashboard queries", () => {
  const query = { from: "2026-09-06", to: "2026-09-12", compare: "previous_period" as const, label: "Last 7 days" };

  const apiDashboard: ApiDashboard = {
    period: { key: "custom", start: "2026-09-06", end: "2026-09-12" },
    kpis: {
      gross_revenue: 1000,
      net_revenue: 900,
      orders: 10,
      aov: 100,
      refunds_total: 100,
      customers: { active: 8, new: 3, returning: 5, returning_rate_pct: 62.5 },
      change_pct: { gross_revenue: 5, orders: 2, aov: 1 },
    },
    revenue_series: [{ date: "2026-09-12", revenue: 1000, orders: 10 }],
    revenue_series_previous: [{ date: "2026-09-05", revenue: 950, orders: 9 }],
    channels: [{ channel: "Online Store", revenue: 1000, orders: 10 }],
    top_products: [{ product_id: 1, title: "Tee", units: 4, revenue: 400, image_url: null }],
    inventory_alerts: [],
    refunds: { count: 1, total: 100, pct_of_revenue: 10 },
    recent_orders: [],
  };

  const apiWhatChanged: ApiWhatChanged = {
    summary: {
      revenue_now: 1000,
      revenue_prev: 950,
      total_delta: 50,
      total_delta_pct: 5.3,
      products_moved: 1,
      concentration_pct: 100,
    },
    movers: [],
  } as unknown as ApiWhatChanged;

  it("builds the exact paths services/dashboard.ts used before SPEC-230", () => {
    expect(dashboardPaths.data(query)).toBe(
      "/dashboard?start=2026-09-06&end=2026-09-12&compare=previous_period",
    );
    expect(dashboardPaths.whatChanged(query)).toBe(
      "/analysis/what-changed?start=2026-09-06&end=2026-09-12",
    );
    expect(dashboardPaths.locations("2026-09-06", "2026-09-12")).toBe(
      "/dashboard/locations?start=2026-09-06&end=2026-09-12",
    );
  });

  it("keys carry range, compare AND label (the label is part of the answer)", () => {
    const def = dashboardQueries.data(query);
    expect(def.queryKey).toEqual(["dashboard", "data", { ...query }]);
    expect(roundTrips(def)).toEqual(def.queryKey);
    expect(dashboardQueries.data({ ...query, label: undefined }).queryKey).toEqual([
      "dashboard",
      "data",
      { from: query.from, to: query.to, compare: query.compare, label: null },
    ]);
    expect(dashboardQueries.locations("2026-09-06", "2026-09-12").queryKey).toEqual([
      "dashboard",
      "locations",
      { from: "2026-09-06", to: "2026-09-12" },
    ]);
  });

  it("composes the aggregate and what-changed in parallel and adapts both", async () => {
    const { api, calls } = fakeApi({
      [dashboardPaths.data(query)]: apiDashboard,
      [dashboardPaths.whatChanged(query)]: apiWhatChanged,
    });
    const data = await loadDashboardData(api, query);
    expect(calls.sort()).toEqual(
      [dashboardPaths.data(query), dashboardPaths.whatChanged(query)].sort(),
    );
    expect(data.periodLabel).toBe("Last 7 days");
    expect(data.periodDate).toBe("2026-09-12");
    expect(data.showComparison).toBe(true);
    expect(data.kpis.length).toBeGreaterThan(0);
    expect(data.whatChanged?.summary.revenueNow).toBe(1000);
    expect(data.topProducts[0]?.name).toBe("Tee");
  });

  it("degrades what-changed to null on failure instead of taking the page down", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { api } = fakeApi({
      [dashboardPaths.data(query)]: apiDashboard,
      [dashboardPaths.whatChanged(query)]: new Error("500"),
    });
    await expect(loadWhatChanged(api, query)).resolves.toBeNull();
    const data = await loadDashboardData(api, query);
    expect(data.whatChanged).toBeNull();
    expect(data.kpis.length).toBeGreaterThan(0);
    expect(consoleError).toHaveBeenCalled();
  });

  it("comparisonLabel: same-day-today gets the '(same time)' suffix, compare=none gets nothing", () => {
    expect(comparisonLabel({ from: "2026-09-12", to: "2026-09-12", compare: "previous_period" }, "2026-09-12")).toMatch(
      /\(same time\)$/,
    );
    expect(comparisonLabel({ from: "2026-09-06", to: "2026-09-12", compare: "none" }, "2026-09-12")).toBeNull();
  });
});

describe("store + analysis queries", () => {
  it("adapt /auth/me and /settings/status to the view models the shell already uses", async () => {
    const { api, calls } = fakeApi({
      [storePaths.me()]: { name: "Mordy", email: "m@example.com" },
      [storePaths.status()]: {
        store: { domain: "examplestore.myshopify.com", name: "Example Store", status: "active", last_sync_at: null },
      },
    });
    await expect(storeQueries.currentUser().load(api)).resolves.toEqual({
      name: "Mordy",
      email: "m@example.com",
    });
    await expect(storeQueries.connection().load(api)).resolves.toEqual({
      name: "Example Store",
      domain: "examplestore.myshopify.com",
      status: "active",
      lastSyncAt: "",
    });
    expect(calls).toEqual(["/auth/me", "/settings/status"]);
    expect(storeQueries.currentUser().queryKey).toEqual(["store", "current-user"]);
    expect(storeQueries.connection().queryKey).toEqual(["store", "connection"]);
  });

  it("dead-inventory alerts resolve null on failure (supporting card, not the page)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ok = fakeApi({ [analysisPaths.deadInventoryAlerts()]: { summary: { styles_flagged: 0 } } });
    await expect(loadDeadInventoryAlerts(ok.api)).resolves.toEqual({ summary: { styles_flagged: 0 } });
    const bad = fakeApi({ [analysisPaths.deadInventoryAlerts()]: new Error("timeout") });
    await expect(analysisQueries.deadInventoryAlerts().load(bad.api)).resolves.toBeNull();
    expect(analysisPaths.deadInventoryAlerts()).toBe("/analysis/inventory/dead-inventory-alerts");
  });
});
