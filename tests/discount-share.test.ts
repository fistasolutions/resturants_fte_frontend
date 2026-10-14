import { describe, expect, it } from "vitest";

import { discountShare, signalFromCounts } from "@/lib/discount-share";

describe("discountShare", () => {
  it("returns null when gross is 0/nullish", () => {
    expect(discountShare(10, 0)).toBeNull();
    expect(discountShare(10, null)).toBeNull();
    expect(discountShare(null, 100)).toBeNull();
  });

  it("computes percentage of gross to one decimal", () => {
    expect(discountShare(24.1, 100)).toBe(24.1);
    expect(discountShare(60, 100)).toBe(60);
    expect(discountShare(1, 3)).toBe(33.3);
  });
});

describe("signalFromCounts", () => {
  it("red wins over yellow, yellow over green", () => {
    expect(signalFromCounts({ red: 2, yellow: 5 })).toBe("red");
    expect(signalFromCounts({ red: 0, yellow: 5 })).toBe("yellow");
    expect(signalFromCounts({ red: 0, yellow: 0 })).toBe("green");
    expect(signalFromCounts(null)).toBe("green");
  });
});
