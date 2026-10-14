import { describe, expect, it } from "vitest";

import {
  comparisonDate,
  dateToISO,
  isComparisonMode,
  isValidISODate,
} from "@/utils/date";

describe("isComparisonMode", () => {
  it("accepts the three modes", () => {
    expect(isComparisonMode("previous_day")).toBe(true);
    expect(isComparisonMode("previous_week")).toBe(true);
    expect(isComparisonMode("previous_month")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isComparisonMode("yesterday")).toBe(false);
    expect(isComparisonMode(undefined)).toBe(false);
    expect(isComparisonMode(1)).toBe(false);
  });
});

describe("isValidISODate", () => {
  it("accepts real dates", () => {
    expect(isValidISODate("2026-05-15")).toBe(true);
    expect(isValidISODate("2024-02-29")).toBe(true); // leap day
  });
  it("rejects malformed strings", () => {
    expect(isValidISODate("15-05-2026")).toBe(false);
    expect(isValidISODate("2026-5-15")).toBe(false);
    expect(isValidISODate("")).toBe(false);
  });
  it("rejects overflow dates", () => {
    expect(isValidISODate("2026-02-31")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
  });
});

describe("comparisonDate", () => {
  it("goes back one day", () => {
    expect(comparisonDate("2026-05-15", "previous_day")).toBe("2026-05-14");
  });
  it("crosses month boundaries by day", () => {
    expect(comparisonDate("2026-05-01", "previous_day")).toBe("2026-04-30");
  });
  it("goes back seven days", () => {
    expect(comparisonDate("2026-05-15", "previous_week")).toBe("2026-05-08");
    expect(comparisonDate("2026-05-03", "previous_week")).toBe("2026-04-26");
  });
  it("goes back one calendar month", () => {
    expect(comparisonDate("2026-05-15", "previous_month")).toBe("2026-04-15");
  });
  it("clamps month-end overflow", () => {
    expect(comparisonDate("2026-05-31", "previous_month")).toBe("2026-04-30");
    expect(comparisonDate("2026-03-31", "previous_month")).toBe("2026-02-28");
  });
  it("crosses year boundaries", () => {
    expect(comparisonDate("2026-01-01", "previous_day")).toBe("2025-12-31");
    expect(comparisonDate("2026-01-15", "previous_month")).toBe("2025-12-15");
  });
});

describe("dateToISO", () => {
  it("formats a local date without timezone drift", () => {
    expect(dateToISO(new Date(2026, 4, 15))).toBe("2026-05-15");
    expect(dateToISO(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
});
