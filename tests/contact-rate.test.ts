import { describe, expect, it } from "vitest";

import { perHundred } from "@/lib/contact-rate";

describe("perHundred", () => {
  it("returns null for null/undefined/non-finite", () => {
    expect(perHundred(null)).toBeNull();
    expect(perHundred(undefined)).toBeNull();
    expect(perHundred(Number.NaN)).toBeNull();
    expect(perHundred(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("scales a ratio to per-100 with one decimal", () => {
    expect(perHundred(0.2445)).toBe(24.5);
    expect(perHundred(0.5)).toBe(50);
    expect(perHundred(0.1)).toBe(10);
    expect(perHundred(0)).toBe(0);
  });
});
