/** SPEC-328 — the Integrations hub's pure logic over backend SPEC-337's two reads. */
import { describe, expect, it } from "vitest";

import {
  STATUS_META,
  dayLabel,
  detailHref,
  filterCounts,
  formatDuration,
  groupByDay,
  healthSegments,
  hubHref,
  matchesFilter,
  matchesQuery,
  nextStep,
  overviewPollInterval,
  parseCategory,
  parseDetailTab,
  parseFilter,
  parseHubTab,
  parseLayout,
  relativeTime,
  runBars,
  sortConnections,
  toActivity,
  toOverview,
  toTestResult,
  type ApiHubConnection,
} from "@/lib/integration-hub";
import { APPS } from "@/lib/integration-catalog";
import type { ActivityItem, HubConnection, HubStatus } from "@/types/integrations";

function api(key: string, status: HubStatus, extra: Partial<ApiHubConnection> = {}): ApiHubConnection {
  return {
    key,
    connected: status !== "not_connected" && status !== "unavailable",
    available: status !== "unavailable",
    status,
    attention: null,
    last_success_at: "2026-09-30T10:00:00+00:00",
    last_run_at: "2026-09-30T10:00:00+00:00",
    last_records: 42,
    runs: ["success", "error", "success"],
    errors_7d: 1,
    can_sync: true,
    can_test: true,
    account: null,
    connected_at: null,
    connected_by: null,
    ...extra,
  };
}

const OVERVIEW = toOverview({
  checked_at: "2026-09-30T10:42:00+00:00",
  summary: { connected: 5, healthy: 2, syncing: 1, pending: 0, warning: 1, attention: 1 },
  integrations: [
    api("gorgias", "healthy"),
    api("quickbooks", "attention", {
      attention: { code: "reconnect", message: "Example Wholesale stopped syncing.", action: "reconnect", detail: null },
      account: {
        companies: [{ id: 3, name: "Example Wholesale", status: "needs_reconnect", last_synced_at: null, last_error: "x" }],
      },
    }),
    api("loop", "syncing"),
    api("meta", "warning", { can_sync: false }),
    api("shopify", "healthy", { account: { shop_domain: "store.myshopify.com", scopes: "read_orders,read_products" } }),
    api("vcount", "not_connected"),
    api("tomorrow-app", "healthy"),
  ],
});

describe("adapters", () => {
  it("turns the overview into camelCase and drops keys this build cannot draw", () => {
    expect(OVERVIEW.integrations.map((i) => i.key)).not.toContain("tomorrow-app");
    const gorgias = OVERVIEW.integrations.find((i) => i.key === "gorgias") as HubConnection;
    expect(gorgias.lastRecords).toBe(42);
    expect(gorgias.errors7d).toBe(1);
    expect(gorgias.canSync).toBe(true);
    const qbo = OVERVIEW.integrations.find((i) => i.key === "quickbooks") as HubConnection;
    expect(qbo.account?.companies?.[0]).toEqual({
      id: 3,
      name: "Example Wholesale",
      status: "needs_reconnect",
      lastSyncedAt: null,
      lastError: "x",
    });
    const shopify = OVERVIEW.integrations.find((i) => i.key === "shopify") as HubConnection;
    expect(shopify.account?.shopDomain).toBe("store.myshopify.com");
  });

  it("adapts the timeline and a test result", () => {
    const [item] = toActivity([
      {
        at: "2026-09-30T10:40:00+00:00",
        key: "gorgias",
        type: "run",
        result: "success",
        message: "Synced 83 records",
        detail: null,
        records: 83,
        duration_seconds: 4.1,
        actor: null,
      },
    ]);
    expect(item.durationSeconds).toBe(4.1);
    expect(toTestResult({ ok: true, latency_ms: 214 })).toEqual({ ok: true, latencyMs: 214, code: null, message: null });
    expect(toTestResult({ ok: null, message: "Checked on the first sync" }).ok).toBeNull();
  });
});

describe("status, order and filters", () => {
  it("names every status and gives it a tone", () => {
    expect(STATUS_META.attention).toEqual({ label: "Needs attention", tone: "destructive" });
    expect(STATUS_META.unavailable.tone).toBe("muted");
  });

  it("puts the store first, then what needs the owner", () => {
    const connected = OVERVIEW.integrations.filter((c) => c.connected);
    expect(sortConnections(connected).map((c) => c.key)).toEqual([
      "shopify",
      "quickbooks",
      "meta",
      "loop",
      "gorgias",
    ]);
  });

  it("filters and counts: syncing includes pending, need-you includes warnings", () => {
    const connected = OVERVIEW.integrations.filter((c) => c.connected);
    expect(filterCounts(connected)).toEqual({ all: 5, healthy: 2, syncing: 1, attention: 2 });
    expect(matchesFilter({ status: "pending" }, "syncing")).toBe(true);
    expect(matchesFilter({ status: "warning" }, "attention")).toBe(true);
    expect(matchesFilter({ status: "healthy" }, "attention")).toBe(false);
  });

  it("searches by name, area and the pages an app powers", () => {
    expect(matchesQuery(APPS.gorgias, "team perf")).toBe(true);
    expect(matchesQuery(APPS.loop, "support & returns")).toBe(true);
    expect(matchesQuery(APPS.loop, "warehouse")).toBe(false);
    expect(matchesQuery({ name: "Slack", description: "Reports in channels" }, "slack")).toBe(true);
    expect(matchesQuery(APPS.meta, "  ")).toBe(true);
  });

  it("draws the strip in proportion", () => {
    expect(healthSegments(OVERVIEW.summary)).toEqual([
      { tone: "success", percent: 40 },
      { tone: "neutral", percent: 20 },
      { tone: "warning", percent: 20 },
      { tone: "destructive", percent: 20 },
    ]);
    expect(healthSegments({ connected: 0, healthy: 0, syncing: 0, pending: 0, warning: 0, attention: 0 })).toEqual([]);
  });

  it("polls only while something is syncing", () => {
    expect(overviewPollInterval(OVERVIEW)).toBe(5000);
    expect(overviewPollInterval(undefined)).toBe(false);
    expect(
      overviewPollInterval({ ...OVERVIEW, integrations: OVERVIEW.integrations.filter((i) => i.status !== "syncing") }),
    ).toBe(false);
  });
});

describe("the owner's next step", () => {
  const reason = (action: "reconnect" | "renew" | "open_settings" | "choose_property" | "retry") => ({
    code: "x",
    message: "m",
    action,
    detail: null,
  });
  it("maps each backend action to one button", () => {
    expect(nextStep({ attention: reason("reconnect"), canSync: true })).toEqual({ kind: "signin", label: "Reconnect" });
    expect(nextStep({ attention: reason("renew"), canSync: false })).toEqual({ kind: "signin", label: "Renew login" });
    expect(nextStep({ attention: reason("choose_property"), canSync: true })?.kind).toBe("settings");
    expect(nextStep({ attention: reason("retry"), canSync: true })).toEqual({ kind: "sync", label: "Sync now" });
    expect(nextStep({ attention: reason("retry"), canSync: false })?.kind).toBe("settings");
    expect(nextStep({ attention: null, canSync: true })).toBeNull();
  });
});

describe("URL state", () => {
  it("parses tabs, filters, layouts and categories, falling back safely", () => {
    expect(parseHubTab("activity")).toBe("activity");
    expect(parseHubTab("nope")).toBe("connected");
    expect(parseFilter("attention")).toBe("attention");
    expect(parseFilter(null)).toBe("all");
    expect(parseLayout("areas")).toBe("areas");
    expect(parseLayout("grid")).toBe("list");
    expect(parseCategory("finance")).toBe("finance");
    expect(parseCategory("soon")).toBe("soon");
    expect(parseCategory("games")).toBe("all");
  });

  it("opens Settings when coming back from a sign-in", () => {
    expect(parseDetailTab(new URLSearchParams(""))).toBe("overview");
    expect(parseDetailTab(new URLSearchParams("google=choose"))).toBe("settings");
    expect(parseDetailTab(new URLSearchParams("connected=Example+Wholesale"))).toBe("settings");
    expect(parseDetailTab(new URLSearchParams("tab=history&meta=connected"))).toBe("history");
  });

  it("writes plain URLs for the defaults", () => {
    expect(hubHref({ tab: "connected", filter: "all", view: "list" })).toBe("/integrations");
    expect(hubHref({ tab: "connected", filter: "attention", view: "cards" })).toBe(
      "/integrations?filter=attention&view=cards",
    );
    expect(hubHref({ tab: "browse", category: "finance" })).toBe("/integrations?tab=browse&category=finance");
    expect(detailHref("gorgias")).toBe("/integrations/gorgias");
    expect(detailHref("gorgias", "settings", { disconnect: "1" })).toBe(
      "/integrations/gorgias?tab=settings&disconnect=1",
    );
  });
});

describe("time", () => {
  const now = new Date("2026-09-30T12:00:00Z");
  it("says how long ago in words", () => {
    expect(relativeTime(null, now)).toBe("Never");
    expect(relativeTime("2026-09-30T11:59:40Z", now)).toBe("Just now");
    expect(relativeTime("2026-09-30T11:48:00Z", now)).toBe("12 min ago");
    expect(relativeTime("2026-09-30T07:00:00Z", now)).toBe("5 h ago");
    expect(relativeTime("2026-09-29T08:00:00Z", now)).toBe("Yesterday");
    expect(relativeTime("2026-09-26T12:00:00Z", now)).toBe("4 days ago");
  });

  it("groups the timeline by day, newest first as given", () => {
    const local = new Date(2026, 8, 30, 12, 0);
    const at = (d: number, h: number) => new Date(2026, 8, d, h, 0).toISOString();
    const items = [{ at: at(30, 10) }, { at: at(30, 9) }, { at: at(29, 22) }, { at: at(27, 8) }];
    const groups = groupByDay(items, local);
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ["Today", 2],
      ["Yesterday", 1],
      [dayLabel(at(27, 8), local), 1],
    ]);
  });

  it("formats durations", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(4.13)).toBe("4.1 s");
    expect(formatDuration(38)).toBe("38 s");
    expect(formatDuration(72)).toBe("1 min 12 s");
  });

  it("turns the newest runs into bars, oldest first", () => {
    const item = (at: string, result: ActivityItem["result"], records: number | null): ActivityItem => ({
      at,
      key: "gorgias",
      type: result === "change" ? "change" : "run",
      result,
      message: "",
      detail: null,
      records,
      durationSeconds: null,
      actor: null,
    });
    const bars = runBars([
      item("3", "success", 10),
      item("2", "change", null),
      item("1", "error", null),
      item("0", "success", 5),
    ]);
    expect(bars).toEqual([
      { at: "0", records: 5, result: "success" },
      { at: "1", records: 0, result: "error" },
      { at: "3", records: 10, result: "success" },
    ]);
  });
});

describe("the timeline pages (SPEC-328 patch)", async () => {
  const { ACTIVITY_PAGE_SIZE, activityPages } = await import("@/lib/integration-hub");
  const { integrationPaths } = await import("@/lib/queries/integrations");

  it("counts pages, never fewer than one", () => {
    expect(ACTIVITY_PAGE_SIZE).toBe(25);
    expect([0, 1, 25, 26, 312].map((n) => activityPages(n))).toEqual([1, 1, 1, 2, 13]);
  });

  it("asks the backend for the page's slice of the merged timeline", () => {
    expect(integrationPaths.activity(null, "all")).toBe("/integrations/activity?kind=all&limit=25&offset=0");
    expect(integrationPaths.activity("gorgias", "problems", 3)).toBe(
      "/integrations/activity?kind=problems&limit=25&offset=50&key=gorgias",
    );
    expect(integrationPaths.activity("loop", "all", 1, 60)).toBe("/integrations/activity?kind=all&limit=60&offset=0&key=loop");
    expect(integrationPaths.activity(null, "all", 0)).toBe("/integrations/activity?kind=all&limit=25&offset=0");
  });
});
