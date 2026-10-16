import { describe, expect, it } from "vitest";

import { parseBreakMinutes, parsePercentRate, parseStoreCode } from "@/lib/restaurant-forms";

describe("restaurant form parsing (SPEC-398)", () => {
  it("takes a break as whole minutes up to 600", () => {
    expect(parseBreakMinutes(" 30 ")).toEqual({ ok: true, value: 30 });
    expect(parseBreakMinutes("0")).toEqual({ ok: true, value: 0 });
    expect(parseBreakMinutes("600")).toEqual({ ok: true, value: 600 });
    expect(parseBreakMinutes("601").ok).toBe(false);
    expect(parseBreakMinutes("12.5").ok).toBe(false);
    expect(parseBreakMinutes("").ok).toBe(false);
    expect(parseBreakMinutes("-5").ok).toBe(false);
  });

  it("reads a percent as a rate", () => {
    expect(parsePercentRate("6", "royalty")).toEqual({ ok: true, value: 0.06 });
    expect(parsePercentRate("6.5%", "royalty")).toEqual({ ok: true, value: 0.065 });
    expect(parsePercentRate("0", "ad fund")).toEqual({ ok: true, value: 0 });
    expect(parsePercentRate("100", "ad fund")).toEqual({ ok: true, value: 1 });
    const over = parsePercentRate("101", "royalty");
    expect(over.ok).toBe(false);
    expect(!over.ok && over.error).toContain("royalty");
    expect(parsePercentRate("six", "royalty").ok).toBe(false);
  });

  it("trims a store number and bounds its length", () => {
    expect(parseStoreCode("  301 ")).toEqual({ ok: true, value: "301" });
    expect(parseStoreCode("   ").ok).toBe(false);
    expect(parseStoreCode("x".repeat(41)).ok).toBe(false);
    expect(parseStoreCode("x".repeat(40)).ok).toBe(true);
  });
});
