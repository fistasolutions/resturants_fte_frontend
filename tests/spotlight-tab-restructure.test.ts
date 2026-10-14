/**
 * SPEC-163 — tab labels + the Daily Picks date dropdown.
 *
 * The rename is label-only on purpose: `?tab=approvals` is shareable and possibly
 * bookmarked, so the id set is asserted unchanged alongside the new wording.
 */
import { describe, expect, it } from "vitest";

import {
  DAILY_PICKS_TODAY_VALUE,
  dailyPicksDateOptions,
  draftHref,
  SPOTLIGHT_TAB_IDS,
  spotlightTabLabel,
  normalizeSpotlightTab,
} from "@/lib/spotlight";

describe("spotlightTabLabel (SPEC-163)", () => {
  it('renames Approvals to "Needs review"', () => {
    // The old label read as "already approved"; the tab actually holds drafts
    // AWAITING a decision, which is why drafts got duplicated onto Inbound.
    expect(spotlightTabLabel("approvals")).toBe("Needs review");
  });

  it("leaves every other tab label alone", () => {
    expect(spotlightTabLabel("overview")).toBe("Overview");
    expect(spotlightTabLabel("inbound")).toBe("Inbound Engine");
    expect(spotlightTabLabel("daily-picks")).toBe("Daily Picks");
    expect(spotlightTabLabel("published")).toBe("Published");
  });

  it("does NOT change the route id — shared links must keep working", () => {
    expect(SPOTLIGHT_TAB_IDS).toContain("approvals");
    expect(normalizeSpotlightTab("approvals")).toBe("approvals");
  });

  it("has a label for every tab id", () => {
    for (const tab of SPOTLIGHT_TAB_IDS) {
      expect(spotlightTabLabel(tab)).toBeTruthy();
    }
  });
});

describe("dailyPicksDateOptions (SPEC-163)", () => {
  const history = [
    { pickDate: "2026-08-25" },
    { pickDate: "2026-08-24" },
    { pickDate: "2026-08-22" },
    { pickDate: "2026-08-23" },
  ];

  it('always leads with "Today"', () => {
    const options = dailyPicksDateOptions(history, "2026-08-25");
    expect(options[0]).toEqual({ value: DAILY_PICKS_TODAY_VALUE, label: "Today" });
    // Must NOT be "" — Radix Select reads an empty value as "nothing
    // selected" and renders a blank trigger.
    expect(options[0].value).not.toBe("");
  });

  it("does not list today twice when today already has a snapshot", () => {
    const options = dailyPicksDateOptions(history, "2026-08-25");
    expect(options.filter((o) => o.value === "2026-08-25")).toHaveLength(0);
    expect(options).toHaveLength(4);
  });

  it("orders past days newest first regardless of input order", () => {
    const options = dailyPicksDateOptions(history, "2026-08-25");
    expect(options.slice(1).map((o) => o.value)).toEqual([
      "2026-08-24",
      "2026-08-23",
      "2026-08-22",
    ]);
  });

  it("returns only Today when there is no history yet", () => {
    expect(dailyPicksDateOptions([], "2026-08-25")).toEqual([
      { value: DAILY_PICKS_TODAY_VALUE, label: "Today" },
    ]);
  });

  it("handles a long history without duplicate option values", () => {
    // The point of the dropdown: any length is fine (this is what the pill strip
    // could not do), and every value stays unique so the Select can resolve its
    // own selection.
    const long = Array.from({ length: 120 }, (_, i) => ({
      pickDate: `2026-04-${String((i % 30) + 1).padStart(2, "0")}`,
    }));
    const options = dailyPicksDateOptions(long, "2026-08-25");
    const values = options.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toHaveLength(31); // 30 distinct days + Today
  });
});

describe("draftHref (SPEC-165)", () => {
  it("prefers the readable slug over the database id", () => {
    expect(
      draftHref({ id: 15, handle: "best-modest-tees-for-summer" }),
    ).toBe("/spotlight/draft/best-modest-tees-for-summer");
  });

  it("falls back to the id when a draft has no handle", () => {
    // Older rows predate handles; the backend resolves both, so an id URL is
    // still valid rather than broken.
    expect(draftHref({ id: 15, handle: null })).toBe("/spotlight/draft/15");
    expect(draftHref({ id: 15 })).toBe("/spotlight/draft/15");
  });

  it("does not emit an empty segment for a blank handle", () => {
    expect(draftHref({ id: 15, handle: "   " })).toBe("/spotlight/draft/15");
  });
});
