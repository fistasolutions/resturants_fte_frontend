/** SPEC-155 — Foresight tab labels: no decorative glyphs, "Store Health" not
 * "Store League" (disambiguated from Store Traffic's footfall league). */

import { describe, expect, it } from "vitest";

import { FORESIGHT_TABS, activeForesightTab } from "@/lib/foresight-tabs";
import { TRAFFIC_TABS } from "@/lib/traffic-tabs";
import { INVENTORY_TABS } from "@/lib/inventory-tabs";

describe("FORESIGHT_TABS labels (SPEC-155)", () => {
  it("uses the exact plain labels, no glyphs", () => {
    expect(FORESIGHT_TABS.map((t) => t.label)).toEqual([
      "Profit Lens",
      "Season Radar",
      "Forecast & Pace",
      "Size Intelligence",
      // SPEC-169: forward-looking stockout prediction, distinct from
      // "Size Intelligence" above (return quality on what already sold).
      "Stockout Risk",
      // SPEC-192: new drops against what a winner had sold by the same age.
      "Launch Watch",
    ]);
  });

  it("carries no decorative glyphs in any label", () => {
    for (const tab of FORESIGHT_TABS) {
      expect(tab.label).not.toMatch(/[◈▦◔⇅]/);
    }
  });

  it("leaves routes untouched", () => {
    expect(FORESIGHT_TABS.map((t) => t.basePath)).toEqual([
      "/foresight",
      "/foresight/season",
      "/foresight/forecast",
      "/foresight/sizes",
      "/foresight/stockout",
      "/foresight/launch",
    ]);
    expect(activeForesightTab("/foresight/season")).toBe("season");
    // Distinct route from /foresight/sizes — the two must never collapse.
    expect(activeForesightTab("/foresight/stockout")).toBe("stockout");
  });
});

describe('"Store League" label collision resolved (SPEC-155)', () => {
  it("is now used by exactly one section — Store Traffic", () => {
    const withLeague = [
      ...FORESIGHT_TABS,
      ...TRAFFIC_TABS,
      ...INVENTORY_TABS,
    ].filter((t) => t.label === "Store League");
    expect(withLeague).toHaveLength(1);
    expect(withLeague[0].basePath).toBe("/traffic/stores");
  });
});

describe("INVENTORY_TABS transfers label (SPEC-155)", () => {
  it("names the transfer direction and keeps its route", () => {
    const transfers = INVENTORY_TABS.find((t) => t.key === "transfers");
    expect(transfers?.label).toBe("Warehouse → Store");
    expect(transfers?.basePath).toBe("/inventory/transfers");
  });
});


describe("Launch Watch tab (SPEC-192)", () => {
  it("is the sixth tab at /foresight/launch", () => {
    expect(FORESIGHT_TABS.map((t) => t.key)).toEqual([
      "profit",
      "season",
      "forecast",
      "sizes",
      "stockout",
      "launch",
    ]);
    expect(FORESIGHT_TABS[5].basePath).toBe("/foresight/launch");
    expect(FORESIGHT_TABS[5].label).toBe("Launch Watch");
  });

  it("activates on its exact route only", () => {
    expect(activeForesightTab("/foresight/launch")).toBe("launch");
    expect(activeForesightTab("/foresight/launch/12")).toBeNull();
  });
});
