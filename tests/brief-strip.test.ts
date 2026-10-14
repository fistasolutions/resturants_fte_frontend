import { describe, expect, it } from "vitest";

import {
  buildBriefStrip,
  checksTile,
  coverageSummary,
  integrationsTile,
  severitySummary,
  weekdayOf,
} from "@/lib/brief-strip";
import type {
  AttentionSeverity,
  BriefAttention,
  BriefAttentionItem,
  BriefCoverageItem,
  BriefData,
  CoverageStatus,
} from "@/types/brief";

function item(key: string, status: AttentionSeverity = "warn"): BriefAttentionItem {
  return { key, status, title: key, count: 1, detail: "" };
}

function attention(items: BriefAttentionItem[], over: Partial<BriefAttention> = {}): BriefAttention {
  return {
    generated_at: "2026-09-12T07:00:00Z",
    total: items.length,
    items,
    checks_run: 9,
    checks_fired: items.length,
    checks_failed: 0,
    ...over,
  };
}

function coverage(...statuses: CoverageStatus[]): BriefCoverageItem[] {
  return statuses.map((status, i) => ({
    key: `c${i}`,
    name: `Integration ${i}`,
    status,
    detail: "",
    last_sync_at: null,
  }));
}

function brief(over: Partial<BriefData> = {}): BriefData {
  return {
    generated_at: "2026-09-12T08:14:00Z",
    yesterday: { date: "2026-09-11", revenue: 54555, orders: 186, revenue_delta_pct: -36.6 },
    decisions: [],
    overnight_watch: [],
    yesterday_kpis: {
      revenue: 54555,
      revenue_delta_pct: -36.6,
      orders: 186,
      orders_delta_pct: -12.3,
      aov: 293.31,
      aov_delta_pct: 4.1,
      new_customers: 40,
      new_customers_delta: 3,
      refunds_total: 5120,
      refunds_pct_of_revenue: 9.4,
    },
    coverage: coverage("live", "live", "live", "live", "live", "live"),
    ...over,
  };
}

describe("weekdayOf", () => {
  it("names the weekday the deltas compare against", () => {
    expect(weekdayOf("2026-09-11")).toBe("Friday");
  });
});

describe("severitySummary", () => {
  it("counts high and medium, omitting a zero", () => {
    expect(severitySummary([item("a", "error"), item("b"), item("c")])).toBe(
      "1 high · 2 medium",
    );
    expect(severitySummary([item("a"), item("b")])).toBe("2 medium");
    expect(severitySummary([item("a", "error")])).toBe("1 high");
    expect(severitySummary([])).toBe("");
  });
});

describe("checksTile", () => {
  it("is absent when attention was not fetched", () => {
    expect(checksTile(null)).toBeNull();
  });

  it("shows fired over run with the severity split", () => {
    const tile = checksTile(attention([item("a", "error"), item("b"), item("c")]));
    expect(tile).toMatchObject({
      key: "checks",
      value: "3",
      suffix: "/9",
      sub: "1 high · 2 medium",
      tone: "bad",
    });
  });

  it("is warn when only medium checks fired and good when none did", () => {
    expect(checksTile(attention([item("a")]))?.tone).toBe("warn");
    const quiet = checksTile(attention([]));
    expect(quiet?.tone).toBe("good");
    expect(quiet?.value).toBe("0");
    expect(quiet?.sub).toBe("none crossed a threshold");
  });

  it("names checks that could not run", () => {
    const tile = checksTile(attention([item("a")], { checks_failed: 2 }));
    expect(tile?.sub).toBe("1 medium · 2 could not run");
  });

  it("falls back to the item count on a payload without check counts", () => {
    const tile = checksTile(
      attention([item("a"), item("b")], {
        checks_run: undefined,
        checks_fired: undefined,
        checks_failed: undefined,
      }),
    );
    expect(tile?.value).toBe("2");
    expect(tile?.suffix).toBeUndefined();
  });
});

describe("coverageSummary / integrationsTile", () => {
  it("says all live when everything is", () => {
    expect(coverageSummary(coverage("live", "live"))).toBe("all live");
    expect(integrationsTile(coverage("live", "live"))).toMatchObject({
      value: "2/2",
      tone: "good",
    });
  });

  it("lists every non-live status and takes the worst tone", () => {
    const mixed = coverage("live", "delayed", "error", "off");
    expect(coverageSummary(mixed)).toBe("1 error · 1 delayed · 1 not connected");
    expect(integrationsTile(mixed)).toMatchObject({ value: "1/4", tone: "bad" });
    expect(integrationsTile(coverage("live", "delayed"))?.tone).toBe("warn");
    expect(integrationsTile(coverage("live", "off"))?.tone).toBe("neutral");
  });

  it("is absent without coverage", () => {
    expect(integrationsTile([])).toBeNull();
  });
});

describe("buildBriefStrip", () => {
  it("builds six tiles on the live brief, in order", () => {
    const tiles = buildBriefStrip(brief(), attention([item("a")]));
    expect(tiles.map((t) => t.key)).toEqual([
      "revenue",
      "orders",
      "aov",
      "refunds",
      "checks",
      "integrations",
    ]);
  });

  it("builds five in the archive, where attention is never fetched", () => {
    const tiles = buildBriefStrip(brief(), null);
    expect(tiles.map((t) => t.key)).toEqual(["revenue", "orders", "aov", "refunds", "integrations"]);
  });

  it("formats the KPIs and compares against the same weekday last week", () => {
    const [revenue, orders, aov, refunds] = buildBriefStrip(brief(), null);
    expect(revenue).toMatchObject({
      label: "Yesterday",
      value: "$54,555.00",
      delta: -36.6,
      invertDelta: false,
      sub: "vs last Friday",
    });
    expect(orders).toMatchObject({ value: "186", delta: -12.3, sub: "vs last Friday" });
    expect(aov).toMatchObject({ value: "$293.31", delta: 4.1 });
    expect(refunds).toMatchObject({
      value: "$5,120.00",
      delta: null,
      invertDelta: true,
      sub: "9.4% of revenue",
    });
  });

  it("shows only the weekday when the backend had no baseline", () => {
    const data = brief();
    data.yesterday_kpis.revenue_delta_pct = null;
    data.yesterday_kpis.refunds_pct_of_revenue = null;
    const [revenue, , , refunds] = buildBriefStrip(data, null);
    expect(revenue.sub).toBe("Friday");
    expect(refunds.sub).toBe("of yesterday's revenue");
  });

  it("drops the integrations tile when the payload has no coverage", () => {
    const tiles = buildBriefStrip(brief({ coverage: [] }), null);
    expect(tiles.map((t) => t.key)).toEqual(["revenue", "orders", "aov", "refunds"]);
  });
});
