import { describe, expect, it } from "vitest";

import {
  RANGE_PRESETS,
  bfcmRange,
  blackFriday,
  compareRangeFor,
  diffDays,
  formatRangeLabel,
  isRangePreset,
  resolveCompareMode,
  resolveDateRange,
} from "@/lib/date-range";

const TODAY = "2026-07-21"; // a Tuesday

describe("RANGE_PRESETS (SPEC-037)", () => {
  it("resolves the fixed presets from today", () => {
    expect(RANGE_PRESETS.today.resolve(TODAY)).toEqual({
      from: "2026-07-21",
      to: "2026-07-21",
    });
    expect(RANGE_PRESETS.yesterday.resolve(TODAY)).toEqual({
      from: "2026-07-20",
      to: "2026-07-20",
    });
    expect(RANGE_PRESETS["7d"].resolve(TODAY)).toEqual({
      from: "2026-07-15",
      to: "2026-07-21",
    });
    expect(RANGE_PRESETS["30d"].resolve(TODAY)).toEqual({
      from: "2026-06-22",
      to: "2026-07-21",
    });
    expect(RANGE_PRESETS["90d"].resolve(TODAY)).toEqual({
      from: "2026-04-23",
      to: "2026-07-21",
    });
  });

  it("resolves the to-date presets", () => {
    expect(RANGE_PRESETS.mtd.resolve(TODAY)).toEqual({
      from: "2026-07-01",
      to: "2026-07-21",
    });
    expect(RANGE_PRESETS.qtd.resolve(TODAY)).toEqual({
      from: "2026-07-01",
      to: "2026-07-21",
    });
    expect(RANGE_PRESETS.qtd.resolve("2026-05-10")).toEqual({
      from: "2026-04-01",
      to: "2026-05-10",
    });
    expect(RANGE_PRESETS.ytd.resolve(TODAY)).toEqual({
      from: "2026-01-01",
      to: "2026-07-21",
    });
  });

  it("crosses month and year boundaries in day arithmetic", () => {
    expect(RANGE_PRESETS["7d"].resolve("2026-01-03")).toEqual({
      from: "2025-12-28",
      to: "2026-01-03",
    });
  });
});

describe("Black Friday / Cyber Monday (SPEC-037)", () => {
  it("computes Black Friday as the day after November's 4th Thursday", () => {
    expect(blackFriday(2025)).toBe("2025-11-28");
    expect(blackFriday(2026)).toBe("2026-11-27");
    expect(blackFriday(2024)).toBe("2024-11-29");
  });

  it("uses last year's window until this year's has started", () => {
    expect(bfcmRange("2026-07-21")).toEqual({
      from: "2025-11-28",
      to: "2025-12-01",
    });
    expect(bfcmRange("2026-11-27")).toEqual({
      from: "2026-11-27",
      to: "2026-11-30",
    });
    expect(bfcmRange("2026-12-15")).toEqual({
      from: "2026-11-27",
      to: "2026-11-30",
    });
  });
});

describe("resolveDateRange precedence (SPEC-037)", () => {
  it("prefers an explicit from/to pair and labels it", () => {
    const range = resolveDateRange(
      { from: "2026-06-01", to: "2026-07-01", range: "7d" },
      TODAY,
    );
    expect(range).toEqual({
      from: "2026-06-01",
      to: "2026-07-01",
      preset: null,
      label: "Jun 1 – Jul 1, 2026",
    });
  });

  it("clamps future dates to today and swaps inverted pairs", () => {
    expect(resolveDateRange({ from: "2026-08-01", to: "2026-08-10" }, TODAY)).toMatchObject({
      from: "2026-07-21",
      to: "2026-07-21",
    });
    expect(resolveDateRange({ from: "2026-07-10", to: "2026-07-01" }, TODAY)).toMatchObject({
      from: "2026-07-01",
      to: "2026-07-10",
    });
  });

  it("resolves presets by key", () => {
    expect(resolveDateRange({ range: "mtd" }, TODAY)).toMatchObject({
      from: "2026-07-01",
      preset: "mtd",
      label: "Month to date",
    });
  });

  it("keeps legacy SPEC-028 URLs working", () => {
    // ?date= → that single day.
    expect(resolveDateRange({ date: "2026-07-15" }, TODAY)).toMatchObject({
      from: "2026-07-15",
      to: "2026-07-15",
      preset: null,
    });
    // Legacy compare values imply their old view period.
    expect(resolveDateRange({ compare: "previous_day" }, TODAY)).toMatchObject({
      preset: "today",
    });
    expect(resolveDateRange({ compare: "previous_week" }, TODAY)).toMatchObject({
      preset: "7d",
    });
    expect(resolveDateRange({ compare: "previous_month" }, TODAY)).toMatchObject({
      preset: "30d",
    });
  });

  it("falls back to Today on garbage or no params (owner feedback 2026-07-21)", () => {
    expect(resolveDateRange({ range: "nope", from: "junk" }, TODAY)).toMatchObject({
      preset: "today",
      from: "2026-07-21",
      to: "2026-07-21",
    });
    expect(resolveDateRange({}, TODAY)).toMatchObject({ preset: "today" });
  });
});

describe("compareRangeFor (SPEC-037, mirrors backend SPEC-031)", () => {
  it("previous_period is the trailing same-length window", () => {
    expect(compareRangeFor("2026-06-01", "2026-07-01", "previous_period")).toEqual({
      from: "2026-05-01",
      to: "2026-05-31",
    });
    expect(compareRangeFor("2026-07-21", "2026-07-21", "previous_period")).toEqual({
      from: "2026-07-20",
      to: "2026-07-20",
    });
  });

  it("previous_year keeps the same calendar dates", () => {
    expect(compareRangeFor("2026-06-01", "2026-07-01", "previous_year")).toEqual({
      from: "2025-06-01",
      to: "2025-07-01",
    });
    // Feb 29 clamps to Feb 28 (backend parity).
    expect(compareRangeFor("2024-02-29", "2024-02-29", "previous_year")).toEqual({
      from: "2023-02-28",
      to: "2023-02-28",
    });
  });

  it("none yields no window", () => {
    expect(compareRangeFor("2026-06-01", "2026-07-01", "none")).toBeNull();
  });
});

describe("mode/preset guards", () => {
  it("resolveCompareMode accepts new modes and defaults everything else", () => {
    expect(resolveCompareMode("previous_year")).toBe("previous_year");
    expect(resolveCompareMode("none")).toBe("none");
    expect(resolveCompareMode("previous_week")).toBe("previous_period"); // legacy
    expect(resolveCompareMode(undefined)).toBe("previous_period");
  });

  it("isRangePreset", () => {
    expect(isRangePreset("bfcm")).toBe(true);
    expect(isRangePreset("last_week")).toBe(false);
  });
});

describe("formatRangeLabel", () => {
  it("formats single day, same-year, and cross-year ranges", () => {
    expect(formatRangeLabel("2026-07-01", "2026-07-01")).toBe("Jul 1, 2026");
    expect(formatRangeLabel("2026-06-01", "2026-07-01")).toBe("Jun 1 – Jul 1, 2026");
    expect(formatRangeLabel("2025-11-28", "2026-01-05")).toBe(
      "Nov 28, 2025 – Jan 5, 2026",
    );
  });
});

describe("diffDays", () => {
  it("counts whole days", () => {
    expect(diffDays("2026-06-01", "2026-07-01")).toBe(30);
    expect(diffDays("2026-07-21", "2026-07-21")).toBe(0);
  });
});

describe("SPEC-318 calendar-aware comparison", () => {
  it("offers the Hebrew comparison only on the Hebrew calendar", async () => {
    const { compareModesFor } = await import("@/lib/date-range");
    expect(compareModesFor("hebrew")).toEqual(["previous_period", "previous_year", "hebrew_year", "none"]);
    expect(compareModesFor(null)).toEqual(["previous_period", "previous_year", "none"]);
    expect(compareModesFor("gregorian")).not.toContain("hebrew_year");
  });

  it("reads an old hebrew_year link as last year elsewhere, and leaves other modes alone", () => {
    expect(resolveCompareMode("hebrew_year", "hebrew")).toBe("hebrew_year");
    expect(resolveCompareMode("hebrew_year", null)).toBe("previous_year");
    expect(resolveCompareMode("hebrew_year", "gregorian")).toBe("previous_year");
    expect(resolveCompareMode("none", null)).toBe("none");
    expect(resolveCompareMode("bogus", null)).toBe("previous_period");
    // Without a calendar the value is taken as it is (existing callers).
    expect(resolveCompareMode("hebrew_year")).toBe("hebrew_year");
  });
});
