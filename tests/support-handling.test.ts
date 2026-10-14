import { describe, expect, it } from "vitest";

import {
  DEFAULT_HANDLING_DAYS,
  HANDLING_DAYS_ERROR,
  handlingDaysOf,
  MAX_HANDLING_DAYS,
  MIN_HANDLING_DAYS,
  parseHandlingDays,
} from "@/lib/support-handling";

describe("the store's handling time reads as the backend reads it (SPEC-364 / backend SPEC-373)", () => {
  it("reads 2 when the hours carry none", () => {
    expect(DEFAULT_HANDLING_DAYS).toBe(2);
    expect(handlingDaysOf({})).toBe(2);
    expect(handlingDaysOf({ handlingDays: undefined })).toBe(2);
  });

  it("keeps a stored whole number from 1 to 30", () => {
    expect(handlingDaysOf({ handlingDays: 1 })).toBe(1);
    expect(handlingDaysOf({ handlingDays: 5 })).toBe(5);
    expect(handlingDaysOf({ handlingDays: 30 })).toBe(30);
  });

  it("holds an out-of-range value to the nearest end and reads a fraction as missing", () => {
    expect(handlingDaysOf({ handlingDays: 0 })).toBe(MIN_HANDLING_DAYS);
    expect(handlingDaysOf({ handlingDays: 45 })).toBe(MAX_HANDLING_DAYS);
    expect(handlingDaysOf({ handlingDays: 2.5 })).toBe(DEFAULT_HANDLING_DAYS);
    expect(handlingDaysOf({ handlingDays: Number.NaN })).toBe(DEFAULT_HANDLING_DAYS);
  });
});

describe("what the owner types is checked before it saves", () => {
  it("accepts a whole number from 1 to 30", () => {
    expect(parseHandlingDays("1")).toBe(1);
    expect(parseHandlingDays(" 7 ")).toBe(7);
    expect(parseHandlingDays("30")).toBe(30);
    expect(parseHandlingDays("05")).toBe(5);
  });

  it("refuses an empty box, zero, past 30, a fraction, a sign or words", () => {
    for (const text of ["", " ", "0", "31", "100", "2.5", "-3", "+4", "1e1", "two"]) {
      expect(parseHandlingDays(text), text).toBeNull();
    }
  });

  it("names the range in its error", () => {
    expect(HANDLING_DAYS_ERROR).toBe("Handling time is a whole number of days from 1 to 30.");
  });
});
