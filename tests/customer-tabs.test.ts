import { describe, expect, it } from "vitest";

import {
  CUSTOMER_TABS,
  activeCustomerTab,
  isCustomerTabRoute,
} from "@/lib/customer-tabs";

describe("customer tabs (SPEC-189)", () => {
  it("exposes four tabs in order", () => {
    expect(CUSTOMER_TABS.map((t) => t.key)).toEqual([
      "money-finder",
      "segments",
      "repeat-clock",
      "health",
    ]);
    expect(CUSTOMER_TABS[0].basePath).toBe("/customers");
  });

  it("matches a tab only on its exact route", () => {
    expect(activeCustomerTab("/customers")).toBe("money-finder");
    expect(activeCustomerTab("/customers/")).toBe("money-finder");
    expect(activeCustomerTab("/customers/segments")).toBe("segments");
    expect(activeCustomerTab("/customers/repeat-clock")).toBe("repeat-clock");
    expect(activeCustomerTab("/customers/health")).toBe("health");
  });

  it("returns null on nested detail routes so they keep their own header", () => {
    expect(activeCustomerTab("/customers/winback")).toBeNull();
    expect(activeCustomerTab("/customers/segments/123")).toBeNull();
    expect(isCustomerTabRoute("/customers/winback")).toBe(false);
    expect(isCustomerTabRoute("/customers/segments")).toBe(true);
  });
});
