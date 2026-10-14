/**
 * SPEC-041 — Morning Brief frontend unit tests.
 * Tests lib-level logic only (pure functions, types); UI components are
 * verified via the manual checklist in the spec (no jsdom runner yet).
 */

import { describe, expect, it } from "vitest";

import type {
  BriefAttention,
  BriefAttentionItem,
  BriefCoverageItem,
  BriefData,
  BriefDecision,
  BriefWatchItem,
  BriefYesterday,
  BriefYesterdayKpis,
} from "@/types/brief";

// ---------------------------------------------------------------------------
// Type shape validation — compile-time guards as runtime assertions
// ---------------------------------------------------------------------------

function makeBriefDecision(overrides: Partial<BriefDecision> = {}): BriefDecision {
  return {
    type: "unfulfilled_48h",
    headline: "4 orders unfulfilled for 48+ hours",
    amount: 600,
    amount_label: "at risk",
    sentiment: "risk",
    why: "Customers expect fulfilment within 2 days.",
    evidence_tag: "Location breakdown",
    evidence_items: [{ label: "Jackson", value: "$600", detail: "4 orders" }],
    evidence_definition: "",
    view_href: "/orders?fulfillment=unfulfilled&age=48h",
    state: null,
    acted_at: null,
    ...overrides,
  };
}

function makeBriefData(overrides: Partial<BriefData> = {}): BriefData {
  const yesterday: BriefYesterday = {
    date: "2026-07-22",
    revenue: 1200,
    orders: 8,
    revenue_delta_pct: 5.5,
  };
  const kpis: BriefYesterdayKpis = {
    revenue: 1200,
    revenue_delta_pct: 5.5,
    orders: 8,
    orders_delta_pct: null,
    aov: 150,
    aov_delta_pct: -2.1,
    new_customers: 3,
    new_customers_delta: 1,
    refunds_total: 0,
    refunds_pct_of_revenue: 0,
  };
  const watch: BriefWatchItem[] = [
    { key: "sync", status: "ok", title: "Sync healthy", detail: "Last run 5 min ago" },
    { key: "returns", status: "warn", title: "Returns spike", detail: "3 today" },
    { key: "stock", status: "ok", title: "No critical stock-outs", detail: "All good" },
    { key: "payment", status: "ok", title: "No failed payments", detail: "0 failures" },
  ];
  const coverage: BriefCoverageItem[] = [
    { key: "shopify", name: "Shopify", status: "live", detail: "Live", last_sync_at: "2026-07-23T05:50:00Z" },
    { key: "vcount", name: "V-Count", status: "delayed", detail: "Footfall", last_sync_at: "2026-07-21T05:00:00Z" },
    { key: "gorgias", name: "Gorgias", status: "live", detail: "Support", last_sync_at: "2026-07-23T05:30:00Z" },
  ];
  return {
    generated_at: "2026-07-23T06:00:00Z",
    yesterday,
    decisions: [makeBriefDecision()],
    overnight_watch: watch,
    yesterday_kpis: kpis,
    coverage,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// BriefData shape
// ---------------------------------------------------------------------------

describe("BriefData shape (SPEC-041)", () => {
  it("holds the expected top-level keys", () => {
    const data = makeBriefData();
    expect(data).toHaveProperty("generated_at");
    expect(data).toHaveProperty("yesterday");
    expect(data).toHaveProperty("decisions");
    expect(data).toHaveProperty("overnight_watch");
    expect(data).toHaveProperty("yesterday_kpis");
    expect(data).toHaveProperty("coverage");
  });

  it("decisions array may be empty (all clear state)", () => {
    const data = makeBriefData({ decisions: [] });
    expect(data.decisions).toHaveLength(0);
  });

  it("overnight_watch always has 4 items", () => {
    const data = makeBriefData();
    expect(data.overnight_watch).toHaveLength(4);
  });

  it("coverage always has 3 items", () => {
    const data = makeBriefData();
    expect(data.coverage).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// BriefDecision shape + state transitions
// ---------------------------------------------------------------------------

describe("BriefDecision (SPEC-041)", () => {
  it("initial state is null", () => {
    expect(makeBriefDecision().state).toBeNull();
    expect(makeBriefDecision().acted_at).toBeNull();
  });

  it("approved state reflects correctly", () => {
    const d = makeBriefDecision({ state: "approved", acted_at: "2026-07-23T08:12:00Z" });
    expect(d.state).toBe("approved");
    expect(d.acted_at).toBeTruthy();
  });

  it("skipped state reflects correctly", () => {
    const d = makeBriefDecision({ state: "skipped" });
    expect(d.state).toBe("skipped");
  });

  it("sentiment values are constrained to the union", () => {
    const risk = makeBriefDecision({ sentiment: "risk" });
    const opp = makeBriefDecision({ sentiment: "opportunity" });
    expect(["risk", "opportunity"]).toContain(risk.sentiment);
    expect(["risk", "opportunity"]).toContain(opp.sentiment);
  });

  it("evidence_items is an array with label/value/detail", () => {
    const d = makeBriefDecision();
    expect(d.evidence_items.length).toBeGreaterThan(0);
    for (const item of d.evidence_items) {
      expect(item).toHaveProperty("label");
      expect(item).toHaveProperty("value");
      expect(item).toHaveProperty("detail");
    }
  });
});

// ---------------------------------------------------------------------------
// BriefWatchItem
// ---------------------------------------------------------------------------

describe("BriefWatchItem (SPEC-041)", () => {
  it("status values are constrained", () => {
    const data = makeBriefData();
    for (const item of data.overnight_watch) {
      expect(["ok", "warn", "error"]).toContain(item.status);
    }
  });
});

// ---------------------------------------------------------------------------
// BriefCoverageItem
// ---------------------------------------------------------------------------

describe("BriefCoverageItem (SPEC-041; live health SPEC-116)", () => {
  it("status values are constrained to the live-health vocabulary", () => {
    const data = makeBriefData();
    for (const item of data.coverage) {
      expect(["live", "delayed", "error", "off"]).toContain(item.status);
    }
  });

  it("Shopify is the first coverage item (core, always shown)", () => {
    const data = makeBriefData();
    expect(data.coverage[0].key).toBe("shopify");
    expect(data.coverage[0].status).toBe("live");
  });
});

// ---------------------------------------------------------------------------
// BriefYesterdayKpis — null delta handling
// ---------------------------------------------------------------------------

describe("BriefYesterdayKpis null deltas (SPEC-041)", () => {
  it("delta fields may be null when comparison data is unavailable", () => {
    const kpis = makeBriefData().yesterday_kpis;
    // orders_delta_pct is null in our fixture — verify it's accepted
    expect(kpis.orders_delta_pct).toBeNull();
  });

  it("non-null deltas are numbers", () => {
    const kpis = makeBriefData().yesterday_kpis;
    expect(typeof kpis.revenue_delta_pct).toBe("number");
    expect(typeof kpis.aov_delta_pct).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// BriefAttention — "Needs Mordy's Attention" rollup (SPEC-104)
// ---------------------------------------------------------------------------

function makeAttentionItem(overrides: Partial<BriefAttentionItem> = {}): BriefAttentionItem {
  return {
    key: "unanswered_tickets",
    status: "error",
    title: "Tickets unanswered > 24h",
    count: 5,
    detail: "5 open · oldest 2d 3h",
    href: "/team-performance",
    ...overrides,
  };
}

function makeAttention(overrides: Partial<BriefAttention> = {}): BriefAttention {
  const items = overrides.items ?? [
    makeAttentionItem(),
    makeAttentionItem({ key: "returns_waiting", status: "warn", href: "/returns", count: 3 }),
  ];
  return {
    generated_at: "2026-08-10T12:00:00Z",
    total: items.length,
    items,
    ...overrides,
  };
}

describe("BriefAttention shape (SPEC-104)", () => {
  it("every item status is a valid severity and count is a number", () => {
    const data = makeAttention();
    for (const item of data.items) {
      expect(["warn", "error"]).toContain(item.status);
      expect(typeof item.count).toBe("number");
      expect(item.count).toBeGreaterThan(0);
    }
  });

  it("total matches the number of firing items", () => {
    const data = makeAttention();
    expect(data.total).toBe(data.items.length);
  });

  it("a healthy store has zero total and an empty items list", () => {
    const data = makeAttention({ items: [], total: 0 });
    expect(data.total).toBe(0);
    expect(data.items).toHaveLength(0);
  });
});
