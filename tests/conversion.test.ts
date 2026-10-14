import { describe, expect, it } from "vitest";

import { conversionPct, formatConversion, hourLabel } from "@/lib/conversion";

describe("conversion helpers", () => {
  it("formats fractional rates as percent, guarding null/invalid", () => {
    expect(formatConversion(0.25)).toBe("25.0%");
    expect(formatConversion(0.333)).toBe("33.3%");
    expect(formatConversion(0)).toBe("0.0%");
    expect(formatConversion(null)).toBe("—");
    expect(formatConversion(undefined)).toBe("—");
    expect(formatConversion(Number.NaN)).toBe("—");
  });

  it("converts a fraction to a clamped 0–100 percentage", () => {
    expect(conversionPct(0.25)).toBe(25);
    expect(conversionPct(1.5)).toBe(100);
    expect(conversionPct(-0.2)).toBe(0);
    expect(conversionPct(null)).toBe(0);
  });

  it("labels hours in 12h form", () => {
    expect(hourLabel(0)).toBe("12a");
    expect(hourLabel(9)).toBe("9a");
    expect(hourLabel(12)).toBe("12p");
    expect(hourLabel(15)).toBe("3p");
  });
});
