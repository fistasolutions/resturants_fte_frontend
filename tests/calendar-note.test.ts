/**
 * SPEC-307 — the festival note and the Hebrew-calendar comparison on the Dashboard.
 *
 * The note tells the owner whether a comparison is like for like, so the tests hold the
 * three cases (same festivals, different festivals, no festival), the exact dates it quotes
 * (the backend's exclusive end read correctly), and the switch it offers.
 */
import { describe, expect, it } from "vitest";

import {
  adaptCalendarNote,
  calendarNoteView,
  compareHref,
  festivalList,
  windowDates,
  type ApiCompareMeta,
} from "@/lib/calendar-note";
import { COMPARE_MODES, COMPARE_MODE_ORDER, compareRangeFor, resolveCompareMode } from "@/lib/date-range";
import { comparisonLabel } from "@/lib/queries/dashboard";

const PESACH_LAST_YEAR: ApiCompareMeta = {
  mode: "hebrew_year",
  start: "2025-04-13T00:00:00+00:00",
  end: "2025-04-21T00:00:00+00:00",
  festivals: ["Pesach"],
  compare_festivals: ["Pesach"],
  aligned: true,
};

const GREGORIAN_LAST_YEAR: ApiCompareMeta = {
  mode: "previous_year",
  start: "2025-04-02T00:00:00+00:00",
  end: "2025-04-10T00:00:00+00:00",
  festivals: ["Pesach"],
  compare_festivals: [],
  aligned: false,
};

describe("the compared window", () => {
  it("reads the backend's exclusive end as the last day covered", () => {
    expect(windowDates(PESACH_LAST_YEAR)).toEqual({ from: "2025-04-13", to: "2025-04-20" });
    expect(windowDates({ start: "2025-04-13T00:00:00+00:00", end: "2025-04-13T00:00:00+00:00" })).toEqual({
      from: "2025-04-13",
      to: "2025-04-13",
    });
  });

  it("labels KPI deltas with the dates the backend compared, whatever the mode", () => {
    const query = { from: "2026-04-02", to: "2026-04-09", compare: "hebrew_year" as const };
    expect(comparisonLabel(query, "2026-09-25", PESACH_LAST_YEAR)).toBe("vs Apr 13 – Apr 20, 2025");
    // An older backend gives no window: the Hebrew mode still says what it compared.
    expect(comparisonLabel(query, "2026-09-25", null)).toBe("vs same festival last year");
    expect(comparisonLabel({ ...query, compare: "none" }, "2026-09-25", null)).toBeNull();
  });
});

describe("the note", () => {
  it("confirms a like-for-like comparison", () => {
    expect(calendarNoteView(adaptCalendarNote(PESACH_LAST_YEAR))).toEqual({
      tone: "info",
      text: "This range includes Pesach — compared with Apr 13 – Apr 20, 2025, which also held Pesach.",
      suggestHebrew: false,
    });
  });

  it("warns when the compared window held different festivals, and offers the switch", () => {
    expect(calendarNoteView(adaptCalendarNote(GREGORIAN_LAST_YEAR))).toEqual({
      tone: "warn",
      text: "This range includes Pesach, but Apr 2 – Apr 9, 2025 held no festival — the comparison isn't like for like.",
      suggestHebrew: true,
    });
  });

  it("never offers the switch when it is already the Hebrew calendar", () => {
    const view = calendarNoteView(
      adaptCalendarNote({ ...PESACH_LAST_YEAR, compare_festivals: ["Pesach", "Shavuos"], aligned: false }),
    );
    expect(view?.suggestHebrew).toBe(false);
  });

  it("says nothing when neither window holds a festival, or the backend is older", () => {
    expect(calendarNoteView(adaptCalendarNote({ ...PESACH_LAST_YEAR, festivals: [], compare_festivals: [] }))).toBeNull();
    expect(adaptCalendarNote({ mode: "previous_year", start: "2025-04-02T00:00:00Z", end: "2025-04-10T00:00:00Z" })).toBeNull();
    expect(calendarNoteView(null)).toBeNull();
  });

  it("lists festivals the way a sentence would", () => {
    expect(festivalList(["Pesach"])).toBe("Pesach");
    expect(festivalList(["Rosh Hashanah", "Yom Kippur"])).toBe("Rosh Hashanah and Yom Kippur");
    expect(festivalList(["Sukkot", "Shemini Atzeres", "Simchas Torah"])).toBe("Sukkot, Shemini Atzeres and Simchas Torah");
  });
});

describe("the comparison modes", () => {
  it("lists four, the Hebrew calendar among them, and keeps every other parameter", () => {
    expect(COMPARE_MODE_ORDER).toEqual(["previous_period", "previous_year", "hebrew_year", "none"]);
    expect(COMPARE_MODES.hebrew_year.label).toBe("Last year (Hebrew calendar)");
    expect(resolveCompareMode("hebrew_year")).toBe("hebrew_year");
    expect(compareRangeFor("2026-04-02", "2026-04-09", "hebrew_year")).toBeNull();
    const params = new URLSearchParams("range=30d&tab=x");
    expect(compareHref("/dashboard", params, "hebrew_year")).toBe("/dashboard?range=30d&tab=x&compare=hebrew_year");
    expect(compareHref("/dashboard", new URLSearchParams("range=30d&compare=hebrew_year"), "previous_period")).toBe(
      "/dashboard?range=30d",
    );
  });
});
