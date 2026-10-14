import { describe, expect, it } from "vitest";

import {
  DISCOUNT_TABS,
  activeDiscountTab,
} from "@/lib/discount-tabs";

describe("Cannibalisation tab (SPEC-186)", () => {
  it("is the fifth tab at /discounts/cannibalisation", () => {
    const keys = DISCOUNT_TABS.map((t) => t.key);
    expect(keys).toEqual([
      "overview", "attention", "staff", "reasons", "cannibalisation", "decisions",
    ]);
    expect(DISCOUNT_TABS[4].basePath).toBe("/discounts/cannibalisation");
    expect(DISCOUNT_TABS[4].label).toBe("Cannibalisation");
  });

  it("activates on its exact route only, never a drill route", () => {
    expect(activeDiscountTab("/discounts/cannibalisation")).toBe("cannibalisation");
    expect(activeDiscountTab("/discounts/cannibalisation/")).toBe("cannibalisation");
    expect(activeDiscountTab("/discounts/cannibalisation/CODE")).toBeNull();
  });

  it("leaves the existing tabs unchanged", () => {
    expect(activeDiscountTab("/discounts")).toBe("overview");
    expect(activeDiscountTab("/discounts/reasons")).toBe("reasons");
  });
});

describe("Decisions tab (SPEC-244)", () => {
  it("is the sixth tab at /discounts/decisions", () => {
    expect(DISCOUNT_TABS[5].key).toBe("decisions");
    expect(DISCOUNT_TABS[5].label).toBe("Decisions");
    expect(DISCOUNT_TABS[5].basePath).toBe("/discounts/decisions");
  });

  it("activates on its exact route only", () => {
    expect(activeDiscountTab("/discounts/decisions")).toBe("decisions");
    expect(activeDiscountTab("/discounts/decisions/SUMMER20")).toBeNull();
  });
});
