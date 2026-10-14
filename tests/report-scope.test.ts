/** SPEC-033 — scope param logic mirrors backend SPEC-026 validation. */
import { describe, expect, it } from "vitest";

import {
  isValidScope,
  locationScope,
  normalizeScope,
  scopeHref,
  scopeLabel,
  vendorScope,
} from "@/lib/report-scope";

describe("scope validation", () => {
  it("accepts all, vendor and location scopes", () => {
    expect(isValidScope("all")).toBe(true);
    expect(isValidScope("vendor:Meli")).toBe(true);
    expect(isValidScope("location:55")).toBe(true);
  });

  it("rejects junk and normalizes it to all", () => {
    for (const junk of ["potato", "vendor:", "location:abc", "location:", ""]) {
      expect(isValidScope(junk)).toBe(false);
    }
    expect(normalizeScope("potato")).toBe("all");
    expect(normalizeScope(undefined)).toBe("all");
    expect(normalizeScope(" vendor:Meli ")).toBe("vendor:Meli");
  });
});

describe("labels and hrefs", () => {
  const locations = [{ id: 55, name: "Cedarhurst" }];

  it("humanizes scope labels", () => {
    expect(scopeLabel("all", locations)).toBe("All");
    expect(scopeLabel(vendorScope("Meli"), locations)).toBe("Meli");
    expect(scopeLabel(locationScope(55), locations)).toBe("Cedarhurst");
    expect(scopeLabel("location:99", locations)).toBe("Location 99");
  });

  it("builds clean hrefs (defaults dropped)", () => {
    expect(scopeHref(null, "all")).toBe("/reports");
    expect(scopeHref("2026-07-17", "all")).toBe("/reports?date=2026-07-17");
    expect(scopeHref("2026-07-17", "vendor:Meli")).toBe(
      "/reports?date=2026-07-17&scope=vendor%3AMeli",
    );
  });
});
