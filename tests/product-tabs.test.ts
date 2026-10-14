import { describe, expect, it } from "vitest";

import {
  PRODUCT_TABS,
  RANGELESS_PRODUCT_TABS,
  activeProductTab,
  isProductTabRoute,
  productTabHref,
} from "@/lib/product-tabs";

describe("activeProductTab", () => {
  it("maps each tab's exact route to its key", () => {
    for (const tab of PRODUCT_TABS) {
      expect(activeProductTab(tab.basePath)).toBe(tab.key);
    }
  });

  it("resolves the base /products route to overview (never a prefix match)", () => {
    expect(activeProductTab("/products")).toBe("overview");
  });

  it("tolerates a trailing slash", () => {
    expect(activeProductTab("/products/catalog/")).toBe("catalog");
    expect(activeProductTab("/products/")).toBe("overview");
  });

  it("returns null on nested/detail and unrelated routes", () => {
    expect(activeProductTab("/products/12345")).toBeNull();
    expect(activeProductTab("/products/catalog/12345")).toBeNull();
    expect(activeProductTab("/inventory")).toBeNull();
    expect(activeProductTab("/")).toBeNull();
  });
});

describe("isProductTabRoute", () => {
  it("is true on the three tab routes and false elsewhere", () => {
    expect(isProductTabRoute("/products")).toBe(true);
    expect(isProductTabRoute("/products/catalog")).toBe(true);
    expect(isProductTabRoute("/products/returns")).toBe(true);
    expect(isProductTabRoute("/products/999")).toBe(false);
    expect(isProductTabRoute("/orders")).toBe(false);
  });
});

describe("productTabHref", () => {
  it("carries only range params across a switch", () => {
    const params = new URLSearchParams({ range: "custom", from: "2026-01-01", to: "2026-01-31" });
    expect(productTabHref("/products/catalog", params)).toBe(
      "/products/catalog?range=custom&from=2026-01-01&to=2026-01-31",
    );
  });

  it("drops non-range params (page, compare, etc.)", () => {
    const params = new URLSearchParams({ range: "30d", page: "3", compare: "previous_period" });
    expect(productTabHref("/products/returns", params)).toBe("/products/returns?range=30d");
  });

  it("returns a bare path when no range params are present", () => {
    expect(productTabHref("/products", new URLSearchParams())).toBe("/products");
  });
});

describe("PRODUCT_TABS labels (SPEC-154)", () => {
  it('labels the returns tab "Return Leak" without changing its route', () => {
    const returns = PRODUCT_TABS.find((t) => t.key === "returns");
    expect(returns?.label).toBe("Return Leak");
    expect(returns?.basePath).toBe("/products/returns");
    expect(activeProductTab("/products/returns")).toBe("returns");
  });
});


describe("True Profit tab (SPEC-185)", () => {
  it("is the fifth tab (after Fit, SPEC-306) and routes to /products/true-profit", () => {
    const keys = PRODUCT_TABS.map((t) => t.key);
    expect(keys).toEqual([
      "overview",
      "catalog",
      "returns",
      "fit",
      "true-profit",
      "content-gaps",
      "bundles",
      "brands",
      "costs",
    ]);
    expect(PRODUCT_TABS[4].basePath).toBe("/products/true-profit");
    expect(PRODUCT_TABS[4].label).toBe("True Profit");
  });

  it("activates on its exact route only", () => {
    expect(activeProductTab("/products/true-profit")).toBe("true-profit");
    expect(activeProductTab("/products/true-profit/")).toBe("true-profit");
    expect(activeProductTab("/products/true-profit/123")).toBeNull();
  });

  it("carries the date range across a switch onto it", () => {
    const params = new URLSearchParams({ range: "custom", from: "2026-08-01", to: "2026-08-31" });
    expect(productTabHref("/products/true-profit", params)).toBe(
      "/products/true-profit?range=custom&from=2026-08-01&to=2026-08-31",
    );
  });
});


describe("Content Gaps tab (SPEC-213)", () => {
  it("is the sixth tab at /products/content-gaps", () => {
    expect(PRODUCT_TABS[5].key).toBe("content-gaps");
    expect(PRODUCT_TABS[5].basePath).toBe("/products/content-gaps");
  });

  it("activates on its exact route only", () => {
    expect(activeProductTab("/products/content-gaps")).toBe("content-gaps");
    expect(activeProductTab("/products/content-gaps/1")).toBeNull();
  });
});


describe("Bundles tab (SPEC-191)", () => {
  it("is the seventh tab at /products/bundles", () => {
    expect(PRODUCT_TABS[6].key).toBe("bundles");
    expect(PRODUCT_TABS[6].basePath).toBe("/products/bundles");
  });

  it("activates on its exact route only", () => {
    expect(activeProductTab("/products/bundles")).toBe("bundles");
    expect(activeProductTab("/products/bundles/9")).toBeNull();
  });
});


describe("Brands tab (SPEC-239)", () => {
  it("is the eighth tab at /products/brands", () => {
    expect(PRODUCT_TABS[7].key).toBe("brands");
    expect(PRODUCT_TABS[7].label).toBe("Brands");
    expect(PRODUCT_TABS[7].basePath).toBe("/products/brands");
  });

  it("activates on its exact route only", () => {
    expect(activeProductTab("/products/brands")).toBe("brands");
    expect(activeProductTab("/products/brands/")).toBe("brands");
    expect(activeProductTab("/products/brands/MELI")).toBeNull();
  });

  it("carries the date range across a switch onto it", () => {
    const params = new URLSearchParams({ range: "30d" });
    expect(productTabHref("/products/brands", params)).toBe("/products/brands?range=30d");
  });
});

describe("Costs tab (SPEC-251)", () => {
  it("is the ninth tab at /products/costs", () => {
    expect(PRODUCT_TABS[8].key).toBe("costs");
    expect(PRODUCT_TABS[8].label).toBe("Costs");
    expect(PRODUCT_TABS[8].basePath).toBe("/products/costs");
  });

  it("activates on its exact route only", () => {
    expect(activeProductTab("/products/costs")).toBe("costs");
    expect(activeProductTab("/products/costs/")).toBe("costs");
    expect(activeProductTab("/products/costs/12")).toBeNull();
  });
});


describe("Fit tab (SPEC-306)", () => {
  it("sits right after Return Leak at /products/fit", () => {
    expect(PRODUCT_TABS[3].key).toBe("fit");
    expect(PRODUCT_TABS[3].label).toBe("Fit");
    expect(PRODUCT_TABS[3].basePath).toBe("/products/fit");
  });

  it("activates on its exact route only; a style page keeps its own header", () => {
    expect(activeProductTab("/products/fit")).toBe("fit");
    expect(activeProductTab("/products/fit/8083366969574")).toBeNull();
  });

  it("is the one tab that takes no date range", () => {
    expect([...RANGELESS_PRODUCT_TABS]).toEqual(["fit"]);
  });
});
