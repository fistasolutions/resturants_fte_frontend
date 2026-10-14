/**
 * SPEC-174 — weekly plan status, derived.
 *
 * Anchored on the real failure: on 2026-08-28 the live store had two plans
 * covering the week of 2026-08-23, both reporting "Active", five days into the
 * week with nothing posted. Every test here is a way that must not happen again.
 */

import { describe, expect, it } from "vitest";

import {
  planProgress,
  planStatus,
  planSummary,
  slotState,
  statusMeta,
  todayISO,
  weekEnd,
  type PlanFacts,
} from "@/lib/weekly-plan-status";

function facts(over: Partial<PlanFacts> = {}): PlanFacts {
  return {
    weekStart: "2026-08-23",
    slotCount: 5,
    postedCount: 0,
    generatedCount: 0,
    supersededBy: null,
    ...over,
  };
}

describe("weekEnd", () => {
  it("ends the week on the Saturday six days after the Sunday", () => {
    expect(weekEnd("2026-08-23")).toBe("2026-08-29");
  });

  it("crosses a month boundary correctly", () => {
    expect(weekEnd("2026-08-30")).toBe("2026-09-05");
  });
});

describe("todayISO", () => {
  it("uses the local calendar day, not UTC", () => {
    // 8pm Eastern on the 28th is already the 29th in UTC — `toISOString()` would
    // call it tomorrow and mark a live day as missed.
    const localEvening = new Date(2026, 7, 28, 20, 30);
    expect(todayISO(localEvening)).toBe("2026-08-28");
  });
});

describe("planStatus", () => {
  it("is Superseded when a newer plan covers the same week", () => {
    // Checked before anything else: a superseded plan's own progress is irrelevant.
    expect(planStatus(facts({ supersededBy: 2, postedCount: 5 }), "2026-08-28")).toBe(
      "superseded",
    );
  });

  it("is Upcoming before the week starts", () => {
    expect(planStatus(facts(), "2026-08-20")).toBe("upcoming");
  });

  it("is In progress during the week", () => {
    expect(planStatus(facts(), "2026-08-28")).toBe("in_progress");
  });

  it("is still In progress on the final Saturday", () => {
    expect(planStatus(facts(), "2026-08-29")).toBe("in_progress");
  });

  it("is Completed when every planned post went out", () => {
    expect(planStatus(facts({ postedCount: 5 }), "2026-08-31")).toBe("completed");
  });

  it("is Partly done when some went out", () => {
    expect(planStatus(facts({ postedCount: 2 }), "2026-08-31")).toBe("partly_done");
  });

  it("is Missed when the week ended with nothing posted", () => {
    // The status the live plans should have been showing, and could not.
    expect(planStatus(facts({ postedCount: 0 }), "2026-08-31")).toBe("missed");
  });

  it("never reports Completed for a plan with no slots", () => {
    expect(planStatus(facts({ slotCount: 0, postedCount: 0 }), "2026-08-31")).toBe(
      "missed",
    );
  });

  it("never stays Active forever — the whole bug", () => {
    const stale = facts({ postedCount: 0 });
    // A year later it is emphatically not "in progress".
    expect(planStatus(stale, "2027-08-28")).toBe("missed");
  });
});

describe("statusMeta", () => {
  it("gives Missed a critical tone, not a cheerful one", () => {
    expect(statusMeta("missed").tone).toBe("critical");
    expect(statusMeta("missed").tone).not.toBe("success");
  });

  it("reserves success for a genuinely completed week", () => {
    expect(statusMeta("completed").tone).toBe("success");
    expect(statusMeta("partly_done").tone).toBe("warning");
  });
});

describe("planSummary", () => {
  it("counts what went out, not what was drafted", () => {
    // The live plans read "1 / 5 drafts" — which made a week with nothing
    // published look underway.
    expect(planSummary(facts({ postedCount: 0 }), "2026-08-28")).toContain(
      "0 of 5 posted",
    );
  });

  it("names the day the week runs out while it is live", () => {
    expect(planSummary(facts(), "2026-08-28")).toContain("week ends 2026-08-29");
  });

  it("surfaces drafts that are written but not yet posted", () => {
    // 3 ready to post is a very different week from 0 drafted — the old
    // "1 / 5 drafts" line carried this and the posted count alone would lose it.
    expect(planSummary(facts({ generatedCount: 3 }), "2026-08-28")).toContain(
      "3 ready to post",
    );
  });

  it("says nothing about drafts when everything drafted already went out", () => {
    expect(
      planSummary(facts({ generatedCount: 2, postedCount: 2 }), "2026-08-28"),
    ).not.toContain("ready to post");
  });

  it("reports what was missed once the week is over", () => {
    expect(planSummary(facts({ postedCount: 2 }), "2026-08-31")).toBe(
      "2 of 5 posted · 3 missed.",
    );
  });

  it("says a superseded plan was replaced rather than scoring it", () => {
    expect(planSummary(facts({ supersededBy: 9 }), "2026-08-28")).toContain(
      "Replaced by a newer plan",
    );
  });

  it("never reports negative missed counts", () => {
    expect(planSummary(facts({ slotCount: 2, postedCount: 5 }), "2026-08-31")).not.toContain(
      "-",
    );
  });
});

describe("planProgress", () => {
  it("is the posted share, rounded", () => {
    expect(planProgress(facts({ slotCount: 5, postedCount: 2 }))).toBe(40);
  });

  it("is 0 for an empty plan rather than dividing by nothing", () => {
    expect(planProgress(facts({ slotCount: 0, postedCount: 0 }))).toBe(0);
  });
});

describe("slotState", () => {
  const slot = (over: Record<string, unknown> = {}) => ({
    scheduledDate: "2026-08-26",
    postId: null as number | null,
    postStatus: null as string | null,
    ...over,
  });

  it("is Posted once the post published", () => {
    expect(slotState(slot({ postId: 1, postStatus: "published" }), "2026-08-28")).toBe(
      "posted",
    );
  });

  it("is Missed for a past day that never went out", () => {
    // A day five days gone currently renders identically to next Tuesday.
    expect(slotState(slot({ postId: 1, postStatus: "approved" }), "2026-08-28")).toBe(
      "missed",
    );
    expect(slotState(slot(), "2026-08-28")).toBe("missed");
  });

  it("is Drafted for a future day that already has a post", () => {
    expect(slotState(slot({ scheduledDate: "2026-08-30", postId: 1 }), "2026-08-28")).toBe(
      "drafted",
    );
  });

  it("is Planned for a future day with nothing yet", () => {
    expect(slotState(slot({ scheduledDate: "2026-08-30" }), "2026-08-28")).toBe("planned");
  });

  it("treats today as still actionable, not missed", () => {
    expect(slotState(slot({ scheduledDate: "2026-08-28" }), "2026-08-28")).toBe("planned");
  });

  it("keeps a published post Posted even when its day has passed", () => {
    expect(
      slotState(slot({ scheduledDate: "2026-08-20", postId: 1, postStatus: "published" }), "2026-08-28"),
    ).toBe("posted");
  });
});
