import { describe, expect, it } from "vitest";

import {
  CURRENCY_COLUMNS,
  TAX_REPORT_COLUMNS,
  formatDifference,
  formatRate,
  generatablePeriods,
  issueSummary,
  lastDayOfMonth,
  sortReportsNewestFirst,
  statusTone,
} from "@/lib/tax-report";
import type { TaxReportSummary } from "@/types/tax-report";

const report = (year: number, month: number, first_day: number): TaxReportSummary =>
  ({ year, month, first_day, id: year * 100 + month } as TaxReportSummary);

describe("tax report columns", () => {
  it("matches the client's Excel order exactly", () => {
    expect([...TAX_REPORT_COLUMNS]).toEqual([
      "Month",
      "Sales Channel",
      "POS Location Name",
      "Taxable Sales",
      "Non-Taxable Sales",
      "Total Sales",
      "Total Tax Rate (%)",
      "Tax 1 Amount",
      "Tax 2 Amount",
      "Tax 3 Amount",
    ]);
  });

  it("treats exactly the money columns as currency", () => {
    expect(CURRENCY_COLUMNS.has("Total Sales")).toBe(true);
    expect(CURRENCY_COLUMNS.has("Total Tax Rate (%)")).toBe(false);
    expect(CURRENCY_COLUMNS.has("Sales Channel")).toBe(false);
  });
});

describe("formatDifference", () => {
  it("keeps the sign so an overstatement reads differently from a shortfall", () => {
    expect(formatDifference(-63325.51)).toBe("-63325.51");
    expect(formatDifference(250)).toBe("+250.00");
  });

  it("never rounds a small discrepancy away to a clean zero", () => {
    // -0.004 rendering as "0.00" would make a broken report look balanced.
    expect(formatDifference(-0.004)).toBe("-0.00");
    expect(formatDifference(0)).toBe("0.00");
  });

  it("renders an absent expected value as a dash, not 0", () => {
    expect(formatDifference(null)).toBe("—");
  });

  it("accepts the string amounts the API sends for Decimals", () => {
    expect(formatDifference("-63325.51")).toBe("-63325.51");
  });
});

describe("formatRate", () => {
  it("keeps three decimals so 8.625% does not become 8.63%", () => {
    expect(formatRate(8.625)).toBe("8.625%");
    expect(formatRate(10.5)).toBe("10.500%");
  });
});

describe("statusTone", () => {
  it("never uses the brand token for status", () => {
    // --brand is identity-only and would collide with --destructive (Rule 9).
    expect(statusTone(false)).not.toContain("brand");
    expect(statusTone(true)).not.toContain("brand");
  });
});

describe("sortReportsNewestFirst", () => {
  it("orders by period, not by when it was generated", () => {
    // A regenerated old report must not jump to the top of the history.
    const sorted = sortReportsNewestFirst([
      report(2026, 7, 23),
      report(2026, 8, 23),
      report(2026, 8, 1),
      report(2025, 12, 23),
    ]);
    expect(sorted.map((r) => `${r.year}-${r.month}-${r.first_day}`)).toEqual([
      "2026-8-23",
      "2026-8-1",
      "2026-7-23",
      "2025-12-23",
    ]);
  });

  it("does not mutate the input", () => {
    const input = [report(2025, 1, 1), report(2026, 1, 1)];
    sortReportsNewestFirst(input);
    expect(input[0].year).toBe(2025);
  });
});

describe("issueSummary", () => {
  it("always gives REVIEW REQUIRED a reason", () => {
    expect(issueSummary([{ area: "Total tax" } as never])).toBe("Total tax");
    expect(
      issueSummary([{ area: "Total tax" }, { area: "Tax components" }] as never),
    ).toBe("Total tax +1 more");
    expect(issueSummary([])).toBe("");
  });
});

describe("generatablePeriods", () => {
  it("offers a period only once it has finished", () => {
    // On August 10th, "August 1-22" has not happened yet — offering it would
    // produce a half-empty report that looks like a data problem.
    const early = generatablePeriods(new Date(2026, 7, 10)).map((p) => p.label);
    expect(early).not.toContain("August 1-22 2026");
    expect(early).not.toContain("August 23-31 2026");
    expect(early[0]).toBe("July 23-31 2026");
  });

  it("offers this month's first period from the 23rd", () => {
    const onThe23rd = generatablePeriods(new Date(2026, 7, 23)).map((p) => p.label);
    expect(onThe23rd[0]).toBe("August 1-22 2026");
    // but not August 23-31 — that month has not closed
    expect(onThe23rd).not.toContain("August 23-31 2026");
  });

  it("uses the correct last day per month, including leap years", () => {
    const labels = generatablePeriods(new Date(2028, 2, 5), 6).map((p) => p.label);
    expect(labels).toContain("February 23-29 2028"); // leap
    const nonLeap = generatablePeriods(new Date(2026, 2, 5), 6).map((p) => p.label);
    expect(nonLeap).toContain("February 23-28 2026");
  });

  it("rolls back across the year boundary", () => {
    const labels = generatablePeriods(new Date(2026, 0, 25), 5).map((p) => p.label);
    expect(labels).toContain("January 1-22 2026");
    expect(labels).toContain("December 23-31 2025");
  });

  it("returns the requested count with stable unique keys", () => {
    const options = generatablePeriods(new Date(2026, 7, 23), 8);
    expect(options).toHaveLength(8);
    expect(new Set(options.map((o) => o.key)).size).toBe(8);
  });
});

describe("lastDayOfMonth", () => {
  it("handles every month length and leap years", () => {
    expect(lastDayOfMonth(2026, 2)).toBe(28);
    expect(lastDayOfMonth(2028, 2)).toBe(29);
    expect(lastDayOfMonth(2026, 9)).toBe(30);
    expect(lastDayOfMonth(2026, 8)).toBe(31);
  });
});
