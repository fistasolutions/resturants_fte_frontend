import { describe, expect, it } from "vitest";

import {
  formatRate,
  rateTone,
  recommendationLabel,
  recommendationReason,
  sizeRank,
} from "@/lib/returns-format";

describe("formatRate", () => {
  it("formats a fraction as a percent", () => {
    expect(formatRate(0.125)).toBe("12.5%");
    expect(formatRate(0.5)).toBe("50%");
    expect(formatRate(0)).toBe("0%");
  });
  it("renders a dash when nothing was sold (null)", () => {
    expect(formatRate(null)).toBe("—");
  });
});

describe("rateTone", () => {
  it("maps rates to severity tones on the fashion-return thresholds", () => {
    expect(rateTone(null)).toBe("none");
    expect(rateTone(0)).toBe("none");
    expect(rateTone(0.05)).toBe("low");
    expect(rateTone(0.1)).toBe("medium");
    expect(rateTone(0.2)).toBe("high");
    expect(rateTone(0.4)).toBe("critical");
  });
  it("uses exclusive lower bounds at the thresholds", () => {
    expect(rateTone(0.07)).toBe("low"); // 0.07 not > 0.07
    expect(rateTone(0.15)).toBe("medium"); // 0.15 not > 0.15
    expect(rateTone(0.3)).toBe("high"); // 0.30 not > 0.30
  });
});

describe("recommendation labels", () => {
  it("labels each recommendation", () => {
    expect(recommendationLabel("keep")).toBe("Keep");
    expect(recommendationLabel("fix")).toBe("Fix");
    expect(recommendationLabel("kill")).toBe("Kill");
  });
  it("gives a reason for each", () => {
    expect(recommendationReason("fix")).toContain("fixing");
    expect(recommendationReason("kill")).toContain("discontinuing");
    expect(recommendationReason("keep")).toContain("healthy");
  });
});

describe("sizeRank", () => {
  it("orders the apparel size run", () => {
    const sizes = ["L", "XS", "M", "S", "XL", "2XL"];
    expect([...sizes].sort((a, b) => sizeRank(a) - sizeRank(b))).toEqual([
      "XS", "S", "M", "L", "XL", "2XL",
    ]);
  });
  it("puts numeric sizes after named and unknowns last", () => {
    expect(sizeRank("4")).toBeGreaterThan(sizeRank("XL"));
    expect(sizeRank("—")).toBe(999);
    expect(sizeRank("4")).toBeLessThan(sizeRank("—"));
  });
});
