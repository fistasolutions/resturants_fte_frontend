import { describe, expect, it } from "vitest";

import {
  formatChange,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatTime,
  getGreeting,
  getInitials,
} from "@/utils/format";

describe("formatCurrency", () => {
  it("formats dollars with cents and thousands separators", () => {
    expect(formatCurrency(24130.5)).toBe("$24,130.50");
  });
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
  it("formats negative amounts", () => {
    expect(formatCurrency(-1230)).toBe("-$1,230.00");
  });
});

describe("formatCompactCurrency", () => {
  it("compacts thousands", () => {
    expect(formatCompactCurrency(24130.5)).toBe("$24.1K");
  });
  it("keeps small values plain", () => {
    expect(formatCompactCurrency(90)).toBe("$90");
  });
  it("compacts zero without suffix", () => {
    expect(formatCompactCurrency(0)).toBe("$0");
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1000000)).toBe("1,000,000");
  });
  it("passes small integers through", () => {
    expect(formatNumber(214)).toBe("214");
  });
});

describe("formatPercent", () => {
  it("keeps one decimal when present", () => {
    expect(formatPercent(34.2)).toBe("34.2%");
  });
  it("drops trailing zero decimals", () => {
    expect(formatPercent(50)).toBe("50%");
  });
  it("rounds to one decimal", () => {
    expect(formatPercent(12.55)).toBe("12.6%");
  });
});

describe("formatChange", () => {
  it("prefixes positive changes with +", () => {
    expect(formatChange(12.5)).toBe("+12.5%");
  });
  it("keeps the minus sign for negative changes", () => {
    expect(formatChange(-3.2)).toBe("-3.2%");
  });
  it("treats zero as unsigned", () => {
    expect(formatChange(0)).toBe("0%");
  });
});

describe("formatDate", () => {
  it("formats an ISO instant as its store-time (NY) short date", () => {
    expect(formatDate("2026-05-15T09:42:00Z")).toBe("May 15, 2026");
  });
  it("uses store (NY) time, not UTC, near midnight (SPEC-129)", () => {
    // 00:01 UTC May 15 == 8:01 PM May 14 in New York → the NY calendar date.
    expect(formatDate("2026-05-15T00:01:00Z")).toBe("May 14, 2026");
  });
  it("renders a date-only string as its literal date (no zone shift)", () => {
    expect(formatDate("2026-05-15")).toBe("May 15, 2026");
  });
});

describe("formatTime", () => {
  it("formats minutes with two digits", () => {
    const formatted = formatTime("2026-05-15T09:05:00Z");
    expect(formatted).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/);
  });
  it("renders in store (NY) time regardless of the runner timezone (SPEC-129)", () => {
    // 02:30 UTC Aug 13 == 10:30 PM Aug 12 in New York (EDT).
    expect(formatTime("2026-08-13T02:30:00Z")).toBe("10:30 PM");
  });
});

describe("formatDateTime", () => {
  it("renders date + time in store (NY) time (SPEC-129)", () => {
    // 02:17 UTC Aug 13 == 10:17 PM Aug 12 in New York — the client's transactions case.
    expect(formatDateTime("2026-08-13T02:17:00Z")).toBe("Aug 12, 2026, 10:17 PM");
  });
  it("returns an em dash for empty/invalid input", () => {
    expect(formatDateTime("")).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
  });
});

describe("getInitials", () => {
  it("uses first and last name initials", () => {
    expect(getInitials("John Smith")).toBe("JS");
  });
  it("uses the first two letters of a single name", () => {
    expect(getInitials("Admin")).toBe("AD");
  });
  it("skips middle names", () => {
    expect(getInitials("Sarah Jane Williams")).toBe("SW");
  });
  it("handles empty input", () => {
    expect(getInitials("  ")).toBe("");
  });
});

describe("getGreeting", () => {
  const at = (hour: number) => new Date(2026, 4, 15, hour, 0, 0);

  it("greets morning from 5am", () => {
    expect(getGreeting(at(5))).toBe("Good morning");
    expect(getGreeting(at(11))).toBe("Good morning");
  });
  it("greets afternoon from noon", () => {
    expect(getGreeting(at(12))).toBe("Good afternoon");
    expect(getGreeting(at(17))).toBe("Good afternoon");
  });
  it("greets evening from 6pm and overnight", () => {
    expect(getGreeting(at(18))).toBe("Good evening");
    expect(getGreeting(at(23))).toBe("Good evening");
    expect(getGreeting(at(4))).toBe("Good evening");
  });
});
