import { describe, expect, it } from "vitest";

import { ORDERS_TABS, activeOrdersTab, isOrdersTabRoute } from "@/lib/order-tabs";

describe("activeOrdersTab", () => {
  it("maps each tab's exact route to its key", () => {
    for (const tab of ORDERS_TABS) {
      expect(activeOrdersTab(tab.basePath)).toBe(tab.key);
    }
  });

  it("resolves the base /orders route to the All tab (never a prefix match)", () => {
    expect(activeOrdersTab("/orders")).toBe("all");
  });

  it("tolerates a trailing slash", () => {
    expect(activeOrdersTab("/orders/returns/")).toBe("returns");
    expect(activeOrdersTab("/orders/")).toBe("all");
  });

  it("returns null on nested/detail routes so the tab shell stays hidden there", () => {
    expect(activeOrdersTab("/orders/7185932863374")).toBeNull();
    expect(activeOrdersTab("/orders/review")).toBeNull();
    expect(activeOrdersTab("/orders/review/send-all")).toBeNull();
    expect(activeOrdersTab("/orders/review/send/loc-1")).toBeNull();
    expect(activeOrdersTab("/orders/returns-spike")).toBeNull();
  });

  it("returns null for unrelated routes", () => {
    expect(activeOrdersTab("/inventory")).toBeNull();
    expect(activeOrdersTab("/")).toBeNull();
  });
});

describe("isOrdersTabRoute", () => {
  it("is true on the four tab routes and false on their detail routes", () => {
    expect(isOrdersTabRoute("/orders")).toBe(true);
    expect(isOrdersTabRoute("/orders/discounted")).toBe(true);
    expect(isOrdersTabRoute("/orders/123")).toBe(false);
    expect(isOrdersTabRoute("/orders/review")).toBe(false);
  });
});

describe("ORDERS_TABS labels (SPEC-154)", () => {
  it('labels the returns tab "Returned Orders" without changing its route', () => {
    const returns = ORDERS_TABS.find((t) => t.key === "returns");
    expect(returns?.label).toBe("Returned Orders");
    expect(returns?.basePath).toBe("/orders/returns");
    expect(activeOrdersTab("/orders/returns")).toBe("returns");
  });
});
