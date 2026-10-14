import { describe, expect, it } from "vitest";

import { PRODUCT, displayBrandName } from "@/lib/product";

describe("displayBrandName", () => {
  it("shows the organization's own name", () => {
    expect(displayBrandName("Example Store")).toBe("Example Store");
  });

  it("trims the organization's name", () => {
    expect(displayBrandName("  Example Store  ")).toBe("Example Store");
  });

  it.each([null, undefined, "", "   "])("falls back to the platform's short name for %j", (name) => {
    expect(displayBrandName(name)).toBe(PRODUCT.short);
  });
});

describe("PRODUCT", () => {
  it("never carries the old platform name", () => {
    for (const value of Object.values(PRODUCT)) {
      expect(value).not.toMatch(/ecommerce[ -]?fte/i);
    }
  });

  it("writes ftes in lower case", () => {
    expect(PRODUCT.name.startsWith("ftes ")).toBe(true);
    expect(PRODUCT.short).toBe("ftes");
  });
});
