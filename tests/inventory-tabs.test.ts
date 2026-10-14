import { describe, expect, it } from "vitest";

import {
  INVENTORY_TABS,
  activeInventoryTab,
  inventoryTabHref,
  isInventoryTabRoute,
} from "@/lib/inventory-tabs";

describe("activeInventoryTab", () => {
  it("maps each tab's exact route to its key", () => {
    for (const tab of INVENTORY_TABS) {
      expect(activeInventoryTab(tab.basePath)).toBe(tab.key);
    }
  });

  it("resolves the base /inventory route to overview (never a prefix match)", () => {
    expect(activeInventoryTab("/inventory")).toBe("overview");
  });

  it("tolerates a trailing slash", () => {
    expect(activeInventoryTab("/inventory/reorder/")).toBe("reorder");
    expect(activeInventoryTab("/inventory/")).toBe("overview");
  });

  it("returns null on nested detail routes so the tab shell stays hidden there", () => {
    expect(activeInventoryTab("/inventory/dead-inventory-alerts/123/loc-1")).toBeNull();
    expect(activeInventoryTab("/inventory/dead-inventory-alerts/123/loc-1/send")).toBeNull();
    expect(activeInventoryTab("/inventory/store-transfers")).toBeNull();
    expect(activeInventoryTab("/inventory/store-transfers/loc-1")).toBeNull();
    expect(activeInventoryTab("/inventory/markdown-plan")).toBeNull();
  });

  it("returns null for unrelated routes", () => {
    expect(activeInventoryTab("/orders")).toBeNull();
    expect(activeInventoryTab("/")).toBeNull();
  });
});

describe("isInventoryTabRoute", () => {
  it("is true on the six tab routes and false on their detail routes", () => {
    expect(isInventoryTabRoute("/inventory")).toBe(true);
    expect(isInventoryTabRoute("/inventory/dead-stock")).toBe(true);
    // Misplaced stock (SPEC-089) is no longer a tab — it's a standalone page.
    expect(isInventoryTabRoute("/inventory/dead-inventory-alerts")).toBe(false);
    expect(isInventoryTabRoute("/inventory/dead-inventory-alerts/1/loc")).toBe(false);
    expect(isInventoryTabRoute("/inventory/store-transfers")).toBe(false);
  });
});

describe("inventoryTabHref", () => {
  it("returns the bare base path when there is no active range", () => {
    expect(inventoryTabHref("/inventory/reorder", new URLSearchParams())).toBe(
      "/inventory/reorder",
    );
  });

  it("carries a preset range across the switch", () => {
    const href = inventoryTabHref("/inventory/transfers", new URLSearchParams("range=90d"));
    expect(href).toBe("/inventory/transfers?range=90d");
  });

  it("carries a custom from/to range across the switch", () => {
    const href = inventoryTabHref(
      "/inventory/by-location",
      new URLSearchParams("from=2026-01-01&to=2026-01-31"),
    );
    expect(href).toBe("/inventory/by-location?from=2026-01-01&to=2026-01-31");
  });

  it("carries the legacy 'period' key", () => {
    expect(
      inventoryTabHref("/inventory", new URLSearchParams("period=7d")),
    ).toBe("/inventory?period=7d");
  });

  it("drops non-range params like page and compare", () => {
    const href = inventoryTabHref(
      "/inventory/reorder",
      new URLSearchParams("range=30d&page=3&compare=previous_period"),
    );
    expect(href).toBe("/inventory/reorder?range=30d");
  });
});


describe("Buy Plan tab (SPEC-211)", () => {
  it("sits in the tab order at /inventory/buy-plan", () => {
    expect(INVENTORY_TABS.map((t) => t.key)).toEqual([
      "overview",
      "reorder",
      "overstock-movers",
      "transfers",
      "dead-stock",
      "by-location",
      "buy-plan",
      "cash-release",
      "allocation",
      "data-trust",
    ]);
    const tab = INVENTORY_TABS.find((t) => t.key === "buy-plan");
    expect(tab?.basePath).toBe("/inventory/buy-plan");
    expect(tab?.hasRange).toBe(true);
  });

  it("activates on its exact route only", () => {
    expect(activeInventoryTab("/inventory/buy-plan")).toBe("buy-plan");
    expect(activeInventoryTab("/inventory/buy-plan/123")).toBeNull();
  });
});


describe("Data Trust tab (SPEC-217)", () => {
  it("carries no date range", () => {
    // Catalogue integrity is the state of the catalogue right now, not a
    // windowed measurement — a range picker here would imply otherwise.
    // Looked up BY KEY: the invariant is about this tab, not about its position,
    // and an index made adding a tab elsewhere fail here for no reason.
    const tab = INVENTORY_TABS.find((t) => t.key === "data-trust");
    expect(tab?.basePath).toBe("/inventory/data-trust");
    expect(tab?.hasRange).toBe(false);
  });

  it("activates on its exact route only", () => {
    expect(activeInventoryTab("/inventory/data-trust")).toBe("data-trust");
    expect(activeInventoryTab("/inventory/data-trust/123")).toBeNull();
  });
});


describe("Cash Release tab (SPEC-218)", () => {
  it("carries no date range — the plan is the stockroom right now", () => {
    const tab = INVENTORY_TABS.find((t) => t.key === "cash-release");
    expect(tab?.basePath).toBe("/inventory/cash-release");
    expect(tab?.hasRange).toBe(false);
  });

  it("activates on its exact route only", () => {
    expect(activeInventoryTab("/inventory/cash-release")).toBe("cash-release");
    expect(activeInventoryTab("/inventory/cash-release/123")).toBeNull();
  });
});


describe("Allocation tab (SPEC-220)", () => {
  it("carries no date range — this is what the stock is doing now", () => {
    const tab = INVENTORY_TABS.find((t) => t.key === "allocation");
    expect(tab?.basePath).toBe("/inventory/allocation");
    expect(tab?.hasRange).toBe(false);
  });

  it("activates on its exact route only", () => {
    expect(activeInventoryTab("/inventory/allocation")).toBe("allocation");
    expect(activeInventoryTab("/inventory/allocation/123")).toBeNull();
  });
});
