import { describe, expect, it } from "vitest";

import { needsOnboarding, sessionRequest } from "@/lib/auth-flows";
import {
  dashboardReady,
  defaultPlanKey,
  planCards,
  railStates,
  syncFinished,
  syncSteps,
  type ApiPlan,
  type BootstrapPayload,
} from "@/lib/onboarding";

function token(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encode({ alg: "HS256" })}.${encode(payload)}.sig`;
}

const STEPS = [
  { key: "shopify", title: "Orders, customers and products", reveals: ["orders"] },
  { key: "inventory", title: "Stock", reveals: ["inventory"] },
  { key: "report", title: "Report", reveals: ["reports"] },
];

function payload(overrides: Partial<BootstrapPayload>): BootstrapPayload {
  return { state: "running", step: null, steps_done: [], steps: STEPS, error: null, ...overrides };
}

describe("the rail", () => {
  it("marks what is done, current and next", () => {
    expect(railStates("plan").map((r) => r.state)).toEqual(["done", "current", "next", "next"]);
    expect(railStates("organization")[0].state).toBe("current");
    expect(railStates("ready").every((r) => r.state === "done")).toBe(true);
  });
});

describe("plans", () => {
  const plans: ApiPlan[] = [
    {
      key: "up_to_3m",
      name: "Up to $3M",
      band_label: "Up to $3M annual revenue",
      min_revenue: 0,
      max_revenue: 3_000_000,
      price_cents: 50_000,
      currency: "USD",
      interval: "month",
      ai_allowance_cents: 5_000,
    },
    {
      key: "3m_to_30m",
      name: "$3M – $30M",
      band_label: "$3M to $30M annual revenue",
      min_revenue: 3_000_000,
      max_revenue: 30_000_000,
      price_cents: 80_050,
      currency: "USD",
      interval: "month",
      ai_allowance_cents: 8_005,
    },
  ];

  it("keeps the backend's order and shows dollars", () => {
    const cards = planCards(plans);
    expect(cards.map((c) => c.key)).toEqual(["up_to_3m", "3m_to_30m"]);
    expect(cards[0]).toMatchObject({ price: "$500", aiAllowance: "$50", interval: "month" });
    expect(cards[1].price).toBe("$800.50");
  });
});

describe("the first sync", () => {
  it("shows each step's state", () => {
    const running = syncSteps(payload({ step: "inventory", steps_done: ["shopify"] }));
    expect(running.map((s) => s.state)).toEqual(["done", "running", "waiting"]);
    const failed = syncSteps(payload({ state: "failed", steps_done: [], error: "Orders: failed" }));
    expect(failed.map((s) => s.state)).toEqual(["failed", "waiting", "waiting"]);
  });

  it("opens the dashboard once the orders are in", () => {
    expect(dashboardReady(payload({}))).toBe(false);
    expect(dashboardReady(payload({ steps_done: ["shopify"] }))).toBe(true);
    expect(dashboardReady(payload({ state: "done" }))).toBe(true);
    expect(syncFinished(payload({}))).toBe(false);
    expect(syncFinished(payload({ state: "failed" }))).toBe(true);
  });
});

describe("the organization and the gate", () => {
  it("creates the organization through the session route, with the bearer", () => {
    expect(sessionRequest({ kind: "organization", name: "  Alpha Goods " })).toEqual({
      path: "/onboarding/organization",
      body: { name: "Alpha Goods" },
      withBearer: true,
    });
    expect(sessionRequest({ kind: "organization", name: "   " })).toBeNull();
  });

  it("sends a signed-in user with no organization to onboarding, and nowhere else", () => {
    expect(needsOnboarding(token({ sub: "1" }), "/orders")).toBe(true);
    expect(needsOnboarding(token({ sub: "1" }), "/onboarding")).toBe(false);
    expect(needsOnboarding(token({ sub: "1" }), "/onboarding/shopify/callback")).toBe(false);
    expect(needsOnboarding(token({ sub: "1", org: 3 }), "/orders")).toBe(false);
    expect(needsOnboarding(undefined, "/orders")).toBe(false);
  });
});

describe("per-day price (SPEC-326)", () => {
  it("averages the monthly price over a year, to the cent", async () => {
    const { perDay, planCards } = await import("@/lib/onboarding");
    expect(perDay(50000, "USD")).toBe("$16.44");
    expect(perDay(80000, "USD")).toBe("$26.30");
    expect(perDay(120000, "USD")).toBe("$39.45");
    const [card] = planCards([
      { key: "up_to_3m", name: "Up to $3M", band_label: "Up to $3M annual revenue", min_revenue: 0, max_revenue: 3_000_000, price_cents: 50000, currency: "USD", interval: "month", ai_allowance_cents: 5000 },
    ]);
    expect(card.perDay).toBe("$16.44");
  });
});


describe("the band the Plan step opens on (SPEC-351)", () => {
  const plans = planCards([
    { key: "up_to_3m", name: "Up to $3M", band_label: "Up to $3M annual revenue", min_revenue: 0, max_revenue: 3_000_000, price_cents: 50_000, currency: "USD", interval: "month", ai_allowance_cents: 20_000 },
    { key: "3m_to_30m", name: "$3M to $30M", band_label: "$3M to $30M annual revenue", min_revenue: 3_000_000, max_revenue: 30_000_000, price_cents: 80_000, currency: "USD", interval: "month", ai_allowance_cents: 8_000 },
    { key: "over_30m", name: "Over $30M", band_label: "Over $30M annual revenue", min_revenue: 30_000_000, max_revenue: null, price_cents: 120_000, currency: "USD", interval: "month", ai_allowance_cents: 12_000 },
  ] satisfies ApiPlan[]);

  it("opens on the plan chosen on /pricing, else the first band", () => {
    expect(plans.map((p) => p.minRevenue)).toEqual([0, 3_000_000, 30_000_000]);
    expect(defaultPlanKey(plans)).toBe("up_to_3m");
    expect(defaultPlanKey(plans, "over_30m")).toBe("over_30m");
    expect(defaultPlanKey(plans, "unknown")).toBe("up_to_3m");
    expect(defaultPlanKey([])).toBe("");
  });
});
