import { describe, expect, it } from "vitest";

import { adaptResearchRun, type ApiResearchRun } from "@/lib/brand-research";
import { parseFrame, toDetail } from "@/lib/first-sync";
import type { BootstrapPayload } from "@/lib/onboarding";
import { checklist } from "@/lib/setup-checklist";
import { detailText, doing, milestones, researchSection, setupProgress, storeSection } from "@/lib/setup-sections";
import { toVisibility, type ApiVisibility } from "@/lib/guided-view";

const STEPS: BootstrapPayload["steps"] = [
  { key: "shopify", title: "Orders, customers and products from the last 30 days", reveals: ["dashboard"] },
  { key: "inventory", title: "Stock at every location", reveals: ["inventory"] },
  { key: "enrich", title: "Order journeys and landed costs", reveals: ["traffic"] },
  { key: "analysis", title: "Forecasts, stock risk and search picks", reveals: ["foresight"] },
  { key: "report", title: "Yesterday's executive report", reveals: ["brief"] },
];

const payload = (over: Partial<BootstrapPayload> = {}): BootstrapPayload => ({
  state: "running",
  step: "shopify",
  steps_done: [],
  steps: STEPS,
  error: null,
  detail: null,
  ...over,
});

function apiRun(over: Partial<ApiResearchRun> = {}): ApiResearchRun {
  return {
    id: 7,
    trigger: "auto",
    status: "running",
    steps: [
      { key: "store", label: "Reading your store", state: "done", detail: "" },
      { key: "voice", label: "Learning how you talk", state: "running", detail: "Reading about-us, faq" },
    ],
    progress: 40,
    found: null,
    competitor_run_id: null,
    error: null,
    started_at: "2026-10-09T10:00:00Z",
    finished_at: null,
    seen_at: null,
    ...over,
  };
}
const run = (over: Partial<ApiResearchRun> = {}) => adaptResearchRun(apiRun(over));

describe("what the running store step is doing", () => {
  it("names the resource loading now and counts the finished ones", () => {
    expect(detailText({ now: "orders", done: { customers: 1240 } })).toBe("Loading orders · Customers 1,240 ✓");
    expect(detailText({ now: "collections", done: { customers: 3, orders: 50, products: -1 } })).toBe(
      "Loading collections · Customers 3 ✓ · Orders 50 ✓ · Products failed",
    );
    // A job reports no records, so nothing is counted.
    expect(detailText({ now: "stockout_predict", done: { inventory_commentary_warm: 0 } })).toBe("Predicting stock-outs");
    expect(detailText(null)).toBeNull();
    expect(doing("something_new")).toBe("something new");
  });

  it("reads the detail off a stream frame, and drops a malformed one", () => {
    const frame = parseFrame(JSON.stringify({ ...payload(), detail: { now: "orders", done: { customers: 3, bad: "x" } } }));
    expect(frame?.detail).toEqual({ now: "orders", done: { customers: 3 } });
    expect(toDetail({ done: {} })).toBeNull();
    expect(toDetail("orders")).toBeNull();
  });
});

describe("Your store", () => {
  it("lists the five steps, the running one saying what it loads", () => {
    const section = storeSection(payload({ step: "inventory", steps_done: ["shopify"], detail: { now: "inventory_reconciliation", done: {} } }))!;
    expect(section).toMatchObject({ state: "running", title: "Loading your store · step 2 of 5", done: 1, total: 5 });
    expect(section.lines.map((l) => [l.key, l.state, l.note])).toEqual([
      ["shopify", "done", null],
      ["inventory", "running", "Counting stock at every location"],
      ["enrich", "waiting", null],
      ["analysis", "waiting", null],
      ["report", "waiting", null],
    ]);
  });

  it("says when it is loaded, and why it stopped", () => {
    expect(storeSection(payload({ state: "done", step: null, steps_done: STEPS.map((s) => s.key) }))).toMatchObject({
      state: "done",
      title: "Your store is loaded",
      done: 5,
    });
    const failed = storeSection(payload({ state: "failed", step: null, error: "Orders could not be read from Shopify." }))!;
    expect(failed.title).toBe("Loading your store stopped");
    expect(failed.lines[0]).toMatchObject({ state: "failed", note: "Orders could not be read from Shopify." });
    expect(storeSection(null)).toBeNull();
  });
});

describe("Your brand", () => {
  const loading = storeSection(payload());
  const loaded = storeSection(payload({ state: "done", step: null, steps_done: STEPS.map((s) => s.key) }));

  it("waits while the store loads, then follows the research live", () => {
    expect(researchSection(null, loading)).toMatchObject({ state: "waiting", title: "Brand Brain research" });
    expect(researchSection(null, loaded)).toBeNull();
    const live = researchSection(run(), loaded)!;
    expect(live).toMatchObject({
      state: "running",
      title: "Researching your brand",
      note: "Reading about-us, faq",
      progress: 40,
      canReview: false,
    });
    // SPEC-367: every step, live, with how many are done and working.
    expect(live.lines.length).toBe(run().steps.length);
    expect(live.lines.find((l) => l.state === "running")?.text).toBe("Reading about-us, faq");
    expect(live.position).toMatch(/ of \d+ done · 1 working$/);
    expect(researchSection(null, loading)!.lines).toEqual([]);
  });

  it("asks for a review once it found something, and goes once seen", () => {
    const found = { facts: 4, personas: 2, voice: 1, words: 0, style: 0, competitors: 3 };
    const done = researchSection(run({ status: "done", found, progress: 100 }), loaded)!;
    expect(done).toMatchObject({
      state: "review",
      title: "Your brand is ready to review",
      canReview: true,
      position: null,
    });
    expect(done.lines.length).toBe(run().steps.length);
    expect(researchSection(run({ status: "done", found, seen_at: "2026-10-09T11:00:00Z" }), loaded)).toBeNull();
    expect(researchSection(run({ status: "done", found: null }), loaded)).toMatchObject({ state: "finished", canReview: false });
    expect(researchSection(run({ status: "failed", error: "The site would not load." }), loaded)).toMatchObject({
      state: "failed",
      note: "The site would not load.",
    });
  });
});

describe("one bar for everything", () => {
  const apps = checklist(
    toVisibility({
      disclosure: "guided",
      pages: {},
      setup: [
        { integration: "shopify", any_of: ["shopify"], for: [], done: true },
        { integration: "loop", any_of: ["loop"], for: [{ kind: "tab", page: "products", tab: "fit" }], done: false },
      ],
    } as ApiVisibility),
  );

  it("counts store steps, the brand once seen, and the apps", () => {
    const store = storeSection(payload({ step: "enrich", steps_done: ["shopify", "inventory"] }));
    const brand = researchSection(null, store);
    expect(setupProgress(store, brand, apps)).toEqual({ done: 3, total: 8, percent: 38, open: true });
  });

  it("closes when nothing is left: a loaded store, a brand with nothing to review, no apps", () => {
    const store = storeSection(payload({ state: "done", step: null, steps_done: STEPS.map((s) => s.key) }));
    const brand = researchSection(run({ status: "done", found: null }), store);
    expect(setupProgress(store, brand, null)).toMatchObject({ open: false });
    expect(setupProgress(null, null, null)).toEqual({ done: 0, total: 0, percent: 0, open: false });
  });

  it("names the milestones Setup opens for — not each step inside the sync", () => {
    const one = storeSection(payload({ step: "inventory", steps_done: ["shopify"] }));
    const two = storeSection(payload({ step: "enrich", steps_done: ["shopify", "inventory"] }));
    expect(milestones(one, researchSection(null, one))).toEqual({ store: "running" });
    expect(milestones(two, null)).toEqual(milestones(one, null));
  });
});
