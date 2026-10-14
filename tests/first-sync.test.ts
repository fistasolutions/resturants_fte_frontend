import { describe, expect, it } from "vitest";

import { pageKey, parseFrame, pathReady, toastView } from "@/lib/first-sync";
import type { BootstrapPayload } from "@/lib/onboarding";

const STEPS = [
  { key: "shopify", title: "Orders, customers and products", reveals: ["dashboard", "orders", "customers"] },
  { key: "inventory", title: "Stock at every location", reveals: ["inventory"] },
  { key: "analysis", title: "Forecasts", reveals: ["foresight", "finance"] },
];

function payload(overrides: Partial<BootstrapPayload>): BootstrapPayload {
  return { state: "running", step: "shopify", steps_done: [], steps: STEPS, error: null, ...overrides };
}

describe("page keys", () => {
  it("names the page a path belongs to", () => {
    expect(pageKey("/")).toBe("dashboard");
    expect(pageKey("/orders/123?tab=items")).toBe("orders");
    expect(pageKey("/employees/finance/vendors/7")).toBe("finance");
    expect(pageKey("/employees")).toBe("employees");
  });
});

describe("progressive reveal", () => {
  it("holds a page until its step is done, and never holds an ungated one", () => {
    const early = payload({});
    expect(pathReady("/orders", early)).toBe(false);
    expect(pathReady("/", early)).toBe(false);
    expect(pathReady("/settings", early)).toBe(true);
    const later = payload({ step: "inventory", steps_done: ["shopify"] });
    expect(pathReady("/orders", later)).toBe(true);
    expect(pathReady("/inventory", later)).toBe(false);
    expect(pathReady("/employees/finance", later)).toBe(false);
  });

  it("is ready when synced, unknown, or failed on a step already done", () => {
    expect(pathReady("/inventory", payload({ state: "done" }))).toBe(true);
    expect(pathReady("/inventory", null)).toBe(true);
    const failed = payload({ state: "failed", step: null, steps_done: ["shopify"] });
    expect(pathReady("/orders", failed)).toBe(true);
    expect(pathReady("/inventory", failed)).toBe(false);
  });
});

describe("the toast", () => {
  it("shows each step and the share done while running", () => {
    const view = toastView(payload({ step: "inventory", steps_done: ["shopify"] }));
    expect(view.tone).toBe("running");
    expect(view.lines.map((l) => l.state)).toEqual(["done", "running", "waiting"]);
    expect(view.fraction).toBeCloseTo(1 / 3);
  });

  it("says done, or why it failed", () => {
    expect(toastView(payload({ state: "done", steps_done: ["shopify", "inventory", "analysis"] })))
      .toMatchObject({ tone: "done", fraction: 1 });
    const failed = toastView(payload({ state: "failed", step: null, error: "Orders could not be read." }));
    expect(failed).toMatchObject({ tone: "failed", detail: "Orders could not be read." });
  });
});

describe("the stream", () => {
  it("reads a bootstrap frame and ignores anything else", () => {
    expect(parseFrame(JSON.stringify(payload({})))?.state).toBe("running");
    expect(parseFrame(JSON.stringify({ state: "missing" }))).toBeNull();
    expect(parseFrame("keep-alive")).toBeNull();
  });
});
