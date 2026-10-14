import { describe, expect, it } from "vitest";

import {
  barWidth,
  depthLabel,
  formatConversion,
  formatPct,
  formatShortDate,
  formatSlot,
  nexusStatusClass,
  nexusStatusLabel,
} from "@/lib/planning-format";

describe("formatSlot", () => {
  it("names the weekday and a 12-hour clock", () => {
    expect(formatSlot({ weekday: 5, hour: 11 })).toBe("Sat 11am");
    expect(formatSlot({ weekday: 1, hour: 15 })).toBe("Tue 3pm");
  });

  it("renders midnight and noon without a zero hour", () => {
    expect(formatSlot({ weekday: 0, hour: 0 })).toBe("Mon 12am");
    expect(formatSlot({ weekday: 0, hour: 12 })).toBe("Mon 12pm");
  });

  it("does not crash on an out-of-range weekday", () => {
    expect(formatSlot({ weekday: 9, hour: 10 })).toBe("? 10am");
  });
});

describe("formatConversion", () => {
  it("renders the API's FRACTION as a percentage", () => {
    expect(formatConversion(0.412)).toBe("41.2%");
    expect(formatConversion(0.1)).toBe("10.0%");
  });

  it("renders an em dash when there is no rate", () => {
    expect(formatConversion(null)).toBe("—");
    expect(formatConversion(undefined)).toBe("—");
  });

  it("treats a zero rate as a real measurement, not as missing", () => {
    expect(formatConversion(0)).toBe("0.0%");
  });
});

describe("formatPct", () => {
  it("keeps one decimal below ten and none above", () => {
    expect(formatPct(4.25)).toBe("4.3%");
    expect(formatPct(150)).toBe("150%");
  });

  it("caps runaway percentages so a cell cannot blow out the column", () => {
    expect(formatPct(40210)).toBe("999+%");
  });

  it("renders an em dash when the threshold does not exist", () => {
    expect(formatPct(null)).toBe("—");
  });
});

describe("barWidth", () => {
  it("clamps to 0–100 so a bar can never overflow its track", () => {
    expect(barWidth(240.9)).toBe(100);
    expect(barWidth(-5)).toBe(0);
    expect(barWidth(62.5)).toBe(62.5);
  });

  it("treats missing and NaN as zero", () => {
    expect(barWidth(null)).toBe(0);
    expect(barWidth(Number.NaN)).toBe(0);
  });
});

describe("formatShortDate", () => {
  it("shortens an ISO date", () => {
    expect(formatShortDate("2026-09-14")).toBe("14 Sept");
  });

  it("renders an em dash for a null projection rather than inventing one", () => {
    expect(formatShortDate(null)).toBe("—");
  });

  it("returns unparseable input unchanged instead of showing Invalid Date", () => {
    expect(formatShortDate("not-a-date")).toBe("not-a-date");
  });
});

describe("nexus status presentation", () => {
  it("labels every status", () => {
    expect(nexusStatusLabel("exceeded")).toBe("Exceeded");
    expect(nexusStatusLabel("registered")).toBe("Registered");
  });

  it("uses the destructive token for exceeded, never brand red (Rule 9)", () => {
    expect(nexusStatusClass("exceeded")).toContain("destructive");
    for (const status of ["exceeded", "approaching", "watch", "registered", "clear"] as const) {
      expect(nexusStatusClass(status)).not.toContain("brand");
    }
  });

  it("gives every status a class", () => {
    for (const status of ["exceeded", "approaching", "watch", "registered", "clear"] as const) {
      expect(nexusStatusClass(status).length).toBeGreaterThan(0);
    }
  });
});

describe("depthLabel", () => {
  it("reads as a discount", () => {
    expect(depthLabel(50)).toBe("50% off");
  });
});
