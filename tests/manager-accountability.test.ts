import { describe, expect, it } from "vitest";

import {
  adaptManagers,
  adaptReportCard,
  type ApiManagerAccountability,
  type ApiReportCard,
} from "@/lib/adapters";
import {
  actRateCell,
  firstMoveText,
  hasReportCard,
  lastNudgeText,
  scoreboardRows,
  sendResultSentence,
  summaryTiles,
} from "@/lib/manager-accountability";
import type { ManagerRow, ReportCardScoreboard } from "@/types/results";

function row(over: Partial<ManagerRow> = {}): ManagerRow {
  return {
    key: "jackson@x.com",
    email: "jackson@x.com",
    name: "Jackson",
    roles: [{ role: "location", locationId: 301, locationName: "Jackson" }],
    nudges: 6,
    worked: 4,
    none: 1,
    early: 1,
    actRate: 0.8,
    medianRespondedHours: 3.4,
    lastNudgeAt: "2026-07-31T13:23:28+00:00",
    daysSinceLast: 46,
    byCategory: { overdue: 4, transfers: 2 },
    latest: [],
    settingsHref: "/settings/manager-notifications?focus=location-301",
    ...over,
  };
}

describe("actRateCell", () => {
  it("is good at 60% and above, warn below, muted while unmeasured", () => {
    expect(actRateCell(row())).toEqual({ text: "80%", tone: "good" });
    expect(actRateCell(row({ actRate: 0.5 }))).toEqual({ text: "50%", tone: "warn" });
    expect(actRateCell(row({ actRate: null, nudges: 2 }))).toEqual({ text: "measuring", tone: "muted" });
    expect(actRateCell(row({ actRate: null, nudges: 0 }))).toEqual({ text: "—", tone: "muted" });
  });
});

describe("firstMoveText", () => {
  it("reads hours, or days past two days, or a dash", () => {
    expect(firstMoveText(row())).toBe("3.4 h");
    expect(firstMoveText(row({ medianRespondedHours: 72 }))).toBe("3 d");
    expect(firstMoveText(row({ medianRespondedHours: null }))).toBe("—");
  });
});

describe("lastNudgeText", () => {
  it("shows the date with how long ago, or never", () => {
    expect(lastNudgeText(row())).toBe("Jul 31 · 46 d ago");
    expect(lastNudgeText(row({ daysSinceLast: 0 }))).toBe("Jul 31 · today");
    expect(lastNudgeText(row({ lastNudgeAt: null, daysSinceLast: null }))).toBe("never");
  });
});

describe("hasReportCard", () => {
  it("is true for a single store, false for a store-level lead", () => {
    expect(hasReportCard(row())).toBe(true);
    expect(
      hasReportCard(row({ roles: [{ role: "warehouse", locationId: null, locationName: null }] })),
    ).toBe(false);
  });
});

describe("summaryTiles", () => {
  it("counts the gap and grades the act rate", () => {
    const tiles = summaryTiles({
      managers: 6, withEmail: 1, neverNudged: 5, nudges: 1, worked: 0, none: 1, early: 0,
    });
    expect(tiles.map((t) => t.key)).toEqual(["managers", "with_email", "never_nudged", "nudges"]);
    expect(tiles[1]).toMatchObject({ value: "1", sub: "5 nobody to tell", tone: "warn" });
    expect(tiles[2]).toMatchObject({ value: "5", tone: "muted" });
    expect(tiles[3]).toMatchObject({ value: "1", sub: "0 worked · 1 no change · 0 measuring", tone: "warn" });
    expect(
      summaryTiles({ managers: 2, withEmail: 2, neverNudged: 0, nudges: 5, worked: 4, none: 1, early: 0 })[3].tone,
    ).toBe("good");
  });
});

describe("sendResultSentence", () => {
  it("says who got it, who was skipped and why, who failed", () => {
    expect(
      sendResultSentence({
        sent: [{ locationId: 1, locationName: "Jackson", recipient: "j@x.com" }],
        skipped: [
          { locationId: 2, locationName: "Lawrence", reason: "no manager email" },
          { locationId: 3, locationName: "Pomona", reason: "no manager email" },
          { locationId: 4, locationName: "Y London", reason: "already sent this week" },
        ],
        failed: [{ locationId: 5, locationName: "Z Israel", reason: "SMTP not configured" }],
      }),
    ).toBe(
      "Sent to 1 store (Jackson). Skipped 2: Lawrence, Pomona — no manager email. " +
        "Skipped 1: Y London — already sent this week. Failed 1: Z Israel (SMTP not configured).",
    );
    expect(sendResultSentence({ sent: [], skipped: [], failed: [] })).toBe("Nothing to send.");
  });
});

describe("scoreboardRows", () => {
  it("formats the card like the email, dashing unknowns", () => {
    const sb: ReportCardScoreboard = {
      health: 81, healthPrev: 80, netMarginPct: 68.5, conversionPct: 37.5,
      discountRatePct: 0.7, discountDiscipline: "Clean", returnRatePct: 26.4,
      fulfillDays: 0.7, rank: 1, of: 4,
    };
    expect(scoreboardRows(sb).map((r) => r.value)).toEqual([
      "81 (↑1)", "1 of 4", "68.5%", "37.5%", "0.7% · Clean", "26.4%", "0.7 days",
    ]);
    const empty: ReportCardScoreboard = {
      health: null, healthPrev: null, netMarginPct: null, conversionPct: null,
      discountRatePct: null, discountDiscipline: null, returnRatePct: null,
      fulfillDays: null, rank: null, of: 0,
    };
    expect(scoreboardRows(empty).every((r) => r.value === "—")).toBe(true);
  });
});

describe("adapters", () => {
  it("map the accountability payload and keep nulls", () => {
    const raw: ApiManagerAccountability = {
      generated_at: "2026-09-15T10:00:00Z",
      summary: { managers: 1, with_email: 0, never_nudged: 1, nudges: 0, worked: 0, none: 0, early: 0 },
      managers: [{
        key: "unassigned:location:302", email: null, name: "Lawrence",
        roles: [{ role: "location", location_id: 302, location_name: "Lawrence" }],
        nudges: 0, worked: 0, none: 0, early: 0, act_rate: null,
        median_responded_hours: null, last_nudge_at: null, days_since_last: null,
        by_category: {}, latest: [], settings_href: "/settings/manager-notifications?focus=location-302",
      }],
    };
    const data = adaptManagers(raw);
    expect(data.summary.neverNudged).toBe(1);
    expect(data.managers[0]).toMatchObject({
      email: null, actRate: null, lastNudgeAt: null, daysSinceLast: null,
      roles: [{ role: "location", locationId: 302, locationName: "Lawrence" }],
    });
  });

  it("map the report card", () => {
    const raw: ApiReportCard = {
      location: { id: 301, name: "Jackson", manager_email: "j@x.com" },
      week: { start: "2026-09-07", end: "2026-09-13" },
      scoreboard: {
        health: 81, health_prev: 80, net_margin_pct: 68.5, conversion_pct: 37.5,
        discount_rate_pct: 0.7, discount_discipline: "Clean", return_rate_pct: 26.4,
        fulfill_days: 0.7, rank: 1, of: 4,
      },
      nudges: [],
      open_now: { unfulfilled_48h: 22, unfulfilled_48h_value: 8404.2 },
      subject: "Jackson — your week of Sep 7: health 81 (↑1), rank 1 of 4",
      text: "…", html: "<html/>",
    };
    const card = adaptReportCard(raw);
    expect(card.scoreboard.healthPrev).toBe(80);
    expect(card.openNow).toEqual({ unfulfilled48h: 22, unfulfilled48hValue: 8404.2 });
    expect(card.location.managerEmail).toBe("j@x.com");
  });
});
