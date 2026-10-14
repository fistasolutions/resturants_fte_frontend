import { describe, expect, it } from "vitest";

import {
  addDaysISO,
  addSlotRequestBody,
  appendSlotToPlan,
  buildPlanBoard,
  buildWeeklyPlanCrumbs,
  dayIsEmpty,
  finishGenAll,
  genAllDone,
  genAllProgressLabel,
  initGenAll,
  mergeSlotIntoPlan,
  planDayLabel,
  recordGenAll,
  slotIsGenerated,
  slotThumbnailSrcs,
  sortPlanSummaries,
  ungeneratedSlots,
  weekdayName,
} from "@/lib/social-plan";
import type { PlanSlot, WeeklyPlan, WeeklyPlanSummary } from "@/types/social";

/** A PlanSlot fixture with sensible defaults, overridable per test. */
function slot(over: Partial<PlanSlot> = {}): PlanSlot {
  return {
    slotId: over.slotId ?? 1,
    productId: 100,
    productName: "Modal Wrap Dress",
    imageUrl: null,
    channel: "instagram",
    scheduledDate: "2026-08-16",
    occasion: null,
    campaignName: "Chanukah Week",
    reason: "best_seller",
    reasonDetail: "Top seller last 30 days.",
    rationale: "Anchors the week — proven demand.",
    postId: null,
    postStatus: null,
    ...over,
  };
}

function plan(over: Partial<WeeklyPlan> = {}): WeeklyPlan {
  return {
    id: 1,
    weekStart: "2026-08-16", // a Sunday
    title: "Chanukah Week",
    slots: [],
    ...over,
  };
}

describe("weekdayName (UTC, no zone shift)", () => {
  it("names the weekday of a bare calendar day", () => {
    expect(weekdayName("2026-08-16")).toBe("Sunday");
    expect(weekdayName("2026-08-17")).toBe("Monday");
    expect(weekdayName("2026-08-22")).toBe("Saturday");
  });

  it("returns empty for an invalid or overflowing date", () => {
    expect(weekdayName("")).toBe("");
    expect(weekdayName("not-a-date")).toBe("");
    expect(weekdayName("2026-02-31")).toBe("");
  });
});

describe("planDayLabel", () => {
  it("formats a short month + day label", () => {
    expect(planDayLabel("2026-08-16")).toBe("Aug 16");
    expect(planDayLabel("2026-01-01")).toBe("Jan 1");
    expect(planDayLabel("2026-12-31")).toBe("Dec 31");
  });

  it("returns empty for an invalid date", () => {
    expect(planDayLabel("2026-13-01")).toBe("");
  });
});

describe("addDaysISO (UTC day math)", () => {
  it("adds days without zone shifting", () => {
    expect(addDaysISO("2026-08-16", 6)).toBe("2026-08-22");
    expect(addDaysISO("2026-08-16", 0)).toBe("2026-08-16");
  });

  it("rolls across month and year boundaries", () => {
    expect(addDaysISO("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("returns empty for an invalid input", () => {
    expect(addDaysISO("bad", 1)).toBe("");
  });
});

describe("buildPlanBoard (7-day board, chronological)", () => {
  it("renders all 7 canonical days from weekStart, even empty ones", () => {
    const board = buildPlanBoard(plan({ slots: [slot({ slotId: 1, scheduledDate: "2026-08-16" })] }));
    expect(board).toHaveLength(7);
    expect(board.map((d) => d.dateISO)).toEqual([
      "2026-08-16",
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
    ]);
    expect(board[0].weekday).toBe("Sunday");
    expect(board[0].slots).toHaveLength(1);
    expect(board[1].slots).toHaveLength(0);
  });

  it("groups multiple slots on the same day, preserving their order", () => {
    const board = buildPlanBoard(
      plan({
        slots: [
          slot({ slotId: 1, scheduledDate: "2026-08-16" }),
          slot({ slotId: 2, scheduledDate: "2026-08-16" }),
        ],
      }),
    );
    expect(board[0].slots.map((s) => s.slotId)).toEqual([1, 2]);
  });

  it("never drops a slot scheduled outside the canonical week", () => {
    const board = buildPlanBoard(
      plan({ slots: [slot({ slotId: 9, scheduledDate: "2026-08-30" })] }),
    );
    const orphan = board.find((d) => d.dateISO === "2026-08-30");
    expect(orphan?.slots.map((s) => s.slotId)).toEqual([9]);
    // Sorted chronologically after the canonical week.
    expect(board[board.length - 1].dateISO).toBe("2026-08-30");
  });
});

describe("slot helpers", () => {
  it("slotIsGenerated is true only when a postId is present", () => {
    expect(slotIsGenerated(slot({ postId: null }))).toBe(false);
    expect(slotIsGenerated(slot({ postId: 42 }))).toBe(true);
  });

  it("ungeneratedSlots keeps only slots without a draft", () => {
    const p = plan({
      slots: [
        slot({ slotId: 1, postId: null }),
        slot({ slotId: 2, postId: 7 }),
        slot({ slotId: 3, postId: null }),
      ],
    });
    expect(ungeneratedSlots(p).map((s) => s.slotId)).toEqual([1, 3]);
  });

  it("mergeSlotIntoPlan replaces by slotId without mutating the input", () => {
    const p = plan({
      slots: [slot({ slotId: 1, postId: null }), slot({ slotId: 2, postId: null })],
    });
    const updated = slot({ slotId: 2, postId: 55, postStatus: "in_review" });
    const next = mergeSlotIntoPlan(p, updated);

    expect(next.slots.find((s) => s.slotId === 2)?.postId).toBe(55);
    expect(next.slots.find((s) => s.slotId === 1)?.postId).toBeNull();
    // Original untouched.
    expect(p.slots.find((s) => s.slotId === 2)?.postId).toBeNull();
    expect(next).not.toBe(p);
  });
});

describe("generate-all progress reducer", () => {
  it("initGenAll starts running for a non-empty run and finished for empty", () => {
    expect(initGenAll(3)).toEqual({ total: 3, succeeded: 0, failed: 0, running: true });
    expect(initGenAll(0)).toEqual({ total: 0, succeeded: 0, failed: 0, running: false });
    // Tolerates junk input.
    expect(initGenAll(-2)).toEqual({ total: 0, succeeded: 0, failed: 0, running: false });
  });

  it("recordGenAll tallies successes and failures immutably", () => {
    const start = initGenAll(2);
    const afterOk = recordGenAll(start, true);
    expect(afterOk).toMatchObject({ succeeded: 1, failed: 0 });
    expect(start.succeeded).toBe(0); // not mutated
    const afterFail = recordGenAll(afterOk, false);
    expect(afterFail).toMatchObject({ succeeded: 1, failed: 1 });
    expect(genAllDone(afterFail)).toBe(2);
  });

  it("genAllProgressLabel shows the current index while running", () => {
    expect(genAllProgressLabel(initGenAll(5))).toBe("Generating 1 of 5…");
    const afterOne = recordGenAll(initGenAll(5), true);
    expect(genAllProgressLabel(afterOne)).toBe("Generating 2 of 5…");
  });

  it("clamps the running index to the total on the last slot", () => {
    let state = initGenAll(2);
    state = recordGenAll(state, true);
    state = recordGenAll(state, true);
    // Still running (finish not yet called): index clamps to total.
    expect(genAllProgressLabel(state)).toBe("Generating 2 of 2…");
  });

  it("summarizes success and partial failure when finished", () => {
    let ok = initGenAll(3);
    ok = recordGenAll(ok, true);
    ok = recordGenAll(ok, true);
    ok = recordGenAll(ok, true);
    expect(genAllProgressLabel(finishGenAll(ok))).toBe("Generated all 3 drafts.");

    let mixed = initGenAll(3);
    mixed = recordGenAll(mixed, true);
    mixed = recordGenAll(mixed, false);
    mixed = recordGenAll(mixed, true);
    expect(genAllProgressLabel(finishGenAll(mixed))).toBe(
      "Generated 2 of 3 — 1 failed. Try those again.",
    );
  });

  it("summarizes an empty run", () => {
    expect(genAllProgressLabel(finishGenAll(initGenAll(0)))).toBe(
      "Every slot already has a draft.",
    );
  });
});

/* ── Weekly Plan history + breadcrumbs (SPEC-138) ─────────────────────────── */

function summary(over: Partial<WeeklyPlanSummary> = {}): WeeklyPlanSummary {
  return {
    id: 1,
    weekStart: "2026-08-16",
    title: "Chanukah Week",
    slotCount: 7,
    generatedCount: 3,
    postedCount: 0,
    supersededBy: null,
    status: "in_progress",
    createdAt: "2026-08-15T09:00:00Z",
    ...over,
  };
}

describe("sortPlanSummaries (newest first)", () => {
  it("orders by createdAt descending", () => {
    const out = sortPlanSummaries([
      summary({ id: 1, createdAt: "2026-08-10T09:00:00Z" }),
      summary({ id: 2, createdAt: "2026-08-15T09:00:00Z" }),
      summary({ id: 3, createdAt: "2026-08-12T09:00:00Z" }),
    ]);
    expect(out.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it("breaks createdAt ties by descending id", () => {
    const out = sortPlanSummaries([
      summary({ id: 5, createdAt: "2026-08-15T09:00:00Z" }),
      summary({ id: 8, createdAt: "2026-08-15T09:00:00Z" }),
    ]);
    expect(out.map((p) => p.id)).toEqual([8, 5]);
  });

  it("sinks unparseable dates below valid ones and never mutates the input", () => {
    const input = [
      summary({ id: 1, createdAt: "not-a-date" }),
      summary({ id: 2, createdAt: "2026-08-15T09:00:00Z" }),
    ];
    const out = sortPlanSummaries(input);
    expect(out.map((p) => p.id)).toEqual([2, 1]);
    expect(input.map((p) => p.id)).toEqual([1, 2]);
  });
});


describe("buildWeeklyPlanCrumbs", () => {
  it("history: Social Media Manager › Weekly Plans (current)", () => {
    expect(buildWeeklyPlanCrumbs({ planTitle: null, postName: null })).toEqual([
      { label: "Social Media Manager", target: "root" },
      { label: "Weekly Plans", target: null },
    ]);
  });

  it("board: makes Weekly Plans clickable and the plan title current", () => {
    expect(
      buildWeeklyPlanCrumbs({ planTitle: "Chanukah Week", postName: null }),
    ).toEqual([
      { label: "Social Media Manager", target: "root" },
      { label: "Weekly Plans", target: "history" },
      { label: "Chanukah Week", target: null },
    ]);
  });

  it("detail: makes the plan title clickable and the post name current", () => {
    expect(
      buildWeeklyPlanCrumbs({ planTitle: "Chanukah Week", postName: "Coastline Midi" }),
    ).toEqual([
      { label: "Social Media Manager", target: "root" },
      { label: "Weekly Plans", target: "history" },
      { label: "Chanukah Week", target: "board" },
      { label: "Coastline Midi", target: null },
    ]);
  });
});

/* ── SPEC-140 fix 1: slot/post thumbnail source resolution ────────────────── */

describe("slotThumbnailSrcs", () => {
  const toUrl = (id: string) => `/api/proxy/social/posts/${id}/image?v=0`;

  it("prefers the generated editorial image, then the product photo", () => {
    expect(slotThumbnailSrcs(42, "https://cdn/p.jpg", toUrl)).toEqual([
      "/api/proxy/social/posts/42/image?v=0",
      "https://cdn/p.jpg",
    ]);
  });

  it("uses only the editorial image when there is no product photo", () => {
    expect(slotThumbnailSrcs(42, null, toUrl)).toEqual([
      "/api/proxy/social/posts/42/image?v=0",
    ]);
  });

  it("falls back to only the product photo when there is no post", () => {
    expect(slotThumbnailSrcs(null, "https://cdn/p.jpg", toUrl)).toEqual([
      "https://cdn/p.jpg",
    ]);
  });

  it("returns an empty list (→ placeholder) when there is neither", () => {
    expect(slotThumbnailSrcs(null, null, toUrl)).toEqual([]);
    expect(slotThumbnailSrcs(undefined, undefined, toUrl)).toEqual([]);
    expect(slotThumbnailSrcs("", "", toUrl)).toEqual([]);
  });

  it("coerces a string postId and calls the injected builder with it", () => {
    expect(slotThumbnailSrcs("7", null, toUrl)).toEqual([
      "/api/proxy/social/posts/7/image?v=0",
    ]);
  });
});

/* ── SPEC-142: add a slot to an empty plan day ────────────────────────────── */

describe("dayIsEmpty", () => {
  it("is true for a day with no slots, false when it has any", () => {
    const board = buildPlanBoard(
      plan({ slots: [slot({ slotId: 1, scheduledDate: "2026-08-16" })] }),
    );
    const sunday = board.find((d) => d.dateISO === "2026-08-16");
    const monday = board.find((d) => d.dateISO === "2026-08-17");
    expect(dayIsEmpty(sunday!)).toBe(false);
    expect(dayIsEmpty(monday!)).toBe(true);
  });
});

describe("addSlotRequestBody", () => {
  it("coerces a string productId to a number and passes channel/date through", () => {
    expect(addSlotRequestBody("501", "instagram", "2026-08-18")).toEqual({
      productId: 501,
      channel: "instagram",
      scheduledDate: "2026-08-18",
    });
  });

  it("accepts a numeric productId unchanged", () => {
    expect(addSlotRequestBody(77, "facebook", "2026-08-20")).toEqual({
      productId: 77,
      channel: "facebook",
      scheduledDate: "2026-08-20",
    });
  });
});

describe("appendSlotToPlan", () => {
  it("appends a new slot without mutating the input", () => {
    const p = plan({ slots: [slot({ slotId: 1 })] });
    const added = slot({ slotId: 2, scheduledDate: "2026-08-18" });
    const next = appendSlotToPlan(p, added);

    expect(next.slots.map((s) => s.slotId)).toEqual([1, 2]);
    expect(p.slots).toHaveLength(1); // original untouched
    expect(next).not.toBe(p);
  });

  it("replaces an existing slot matched by slotId (idempotent re-add)", () => {
    const p = plan({
      slots: [slot({ slotId: 1, channel: "instagram" }), slot({ slotId: 2 })],
    });
    const updated = slot({ slotId: 1, channel: "facebook" });
    const next = appendSlotToPlan(p, updated);

    expect(next.slots).toHaveLength(2);
    expect(next.slots.find((s) => s.slotId === 1)?.channel).toBe("facebook");
  });
});

/* ── SPEC-140 fix 6: active (live) plan detection ─────────────────────────── */

