import { describe, expect, it } from "vitest";

import {
  buildMonthGrid,
  buildWeekGrid,
  groupPostsByDate,
  initialMonth,
  isDropEligible,
  isPastDay,
  monthTitle,
  readyToSchedule,
  removePost,
  replacePost,
  rescheduledPost,
  scheduleRequestBody,
  scheduledByDateSorted,
  scheduledPosts,
  shiftDateISO,
  weekRangeLabel,
  weekStartISO,
} from "@/lib/social-calendar";
import type { CalendarPost } from "@/types/social";

function post(overrides: Partial<CalendarPost> = {}): CalendarPost {
  return {
    id: "p1",
    productName: "Test Dress",
    channel: "instagram",
    status: "approved",
    persona: "The Statement Dresser",
    pillar: "Fit confidence",
    imageUrl: null,
    scheduledFor: null,
    trackedLink: null,
    ...overrides,
  };
}

const POSTS: CalendarPost[] = [
  post({ id: "a", scheduledFor: "2026-08-12", status: "scheduled" }),
  post({ id: "b", scheduledFor: "2026-08-12", status: "scheduled" }),
  post({ id: "c", scheduledFor: "2026-08-20", status: "scheduled" }),
  post({ id: "d", scheduledFor: null, status: "approved" }),
  post({ id: "e", scheduledFor: null, status: "approved" }),
];

describe("readyToSchedule / scheduledPosts", () => {
  it("splits undated (ready) from dated (scheduled) posts", () => {
    expect(readyToSchedule(POSTS).map((p) => p.id)).toEqual(["d", "e"]);
    expect(scheduledPosts(POSTS).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("handles an empty list", () => {
    expect(readyToSchedule([])).toEqual([]);
    expect(scheduledPosts([])).toEqual([]);
  });
});

describe("groupPostsByDate", () => {
  it("buckets scheduled posts by their date and skips undated ones", () => {
    const byDate = groupPostsByDate(POSTS);
    expect(byDate.get("2026-08-12")?.map((p) => p.id)).toEqual(["a", "b"]);
    expect(byDate.get("2026-08-20")?.map((p) => p.id)).toEqual(["c"]);
    expect(byDate.has("no-date")).toBe(false);
    // Two distinct dates only — undated posts are excluded.
    expect(byDate.size).toBe(2);
  });
});

describe("buildMonthGrid", () => {
  const byDate = groupPostsByDate(POSTS);
  // August 2026: month index 7. Aug 1, 2026 is a Saturday.
  const weeks = buildMonthGrid(2026, 7, byDate, "2026-08-12");

  it("produces Sunday-first, 7-column weeks", () => {
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    // Aug 1 2026 is a Saturday → first week has 6 leading spill days then Aug 1.
    expect(weeks[0][0].inCurrentMonth).toBe(false);
    expect(weeks[0][6]).toMatchObject({ day: 1, inCurrentMonth: true });
  });

  it("places scheduled posts on their day and marks today", () => {
    const cells = weeks.flat();
    const aug12 = cells.find((c) => c.dateISO === "2026-08-12");
    expect(aug12?.posts.map((p) => p.id)).toEqual(["a", "b"]);
    expect(aug12?.isToday).toBe(true);
    const aug20 = cells.find((c) => c.dateISO === "2026-08-20");
    expect(aug20?.posts.map((p) => p.id)).toEqual(["c"]);
    expect(aug20?.isToday).toBe(false);
  });

  it("covers every real day of the month exactly once", () => {
    const inMonth = weeks.flat().filter((c) => c.inCurrentMonth);
    expect(inMonth).toHaveLength(31); // August has 31 days
    expect(inMonth[0].day).toBe(1);
    expect(inMonth[30].day).toBe(31);
  });

  it("is timezone-stable (dates come out as the given UTC day)", () => {
    // A February leap check + a month starting on Sunday both stay aligned.
    const feb = buildMonthGrid(2028, 1, new Map(), "2028-01-01").flat();
    const febDays = feb.filter((c) => c.inCurrentMonth);
    expect(febDays).toHaveLength(29); // 2028 is a leap year
    expect(febDays[0].dateISO).toBe("2028-02-01");
  });
});

describe("monthTitle", () => {
  it("names the 0-based month with its year", () => {
    expect(monthTitle(2026, 7)).toBe("August 2026");
    expect(monthTitle(2026, 0)).toBe("January 2026");
    expect(monthTitle(2026, 11)).toBe("December 2026");
  });
});

describe("initialMonth", () => {
  it("opens on the earliest scheduled post's month", () => {
    expect(initialMonth(POSTS, "2026-09-01")).toEqual({ year: 2026, month: 7 });
  });

  it("falls back to today's month when nothing is scheduled", () => {
    const ready = [post({ id: "d" }), post({ id: "e" })];
    expect(initialMonth(ready, "2026-11-15")).toEqual({ year: 2026, month: 10 });
  });
});

describe("scheduledByDateSorted", () => {
  it("returns days in ascending date order with their posts", () => {
    const days = scheduledByDateSorted(POSTS);
    expect(days.map((d) => d.dateISO)).toEqual(["2026-08-12", "2026-08-20"]);
    expect(days[0].posts.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("is empty when nothing is scheduled", () => {
    expect(scheduledByDateSorted([post({ id: "d" })])).toEqual([]);
  });
});

/* ── SPEC-143: date rules, week grid & client-model transitions ─────────── */

describe("isPastDay / isDropEligible", () => {
  const today = "2026-08-18";

  it("treats days before today as past, today and future as not", () => {
    expect(isPastDay("2026-08-17", today)).toBe(true);
    expect(isPastDay("2026-08-18", today)).toBe(false); // today is not past
    expect(isPastDay("2026-08-19", today)).toBe(false);
    // Year/month boundaries compare lexicographically-correctly.
    expect(isPastDay("2025-12-31", today)).toBe(true);
    expect(isPastDay("2026-09-01", today)).toBe(false);
  });

  it("drop-eligibility is the complement of past (today + future accept)", () => {
    expect(isDropEligible("2026-08-17", today)).toBe(false);
    expect(isDropEligible("2026-08-18", today)).toBe(true);
    expect(isDropEligible("2026-08-25", today)).toBe(true);
  });
});

describe("weekStartISO / shiftDateISO", () => {
  it("resolves the Sunday of the containing week", () => {
    // 2026-08-18 is a Tuesday → week starts Sunday 2026-08-16.
    expect(weekStartISO("2026-08-18")).toBe("2026-08-16");
    // A Sunday returns itself.
    expect(weekStartISO("2026-08-16")).toBe("2026-08-16");
  });

  it("shifts bare calendar days across month/year boundaries (UTC-stable)", () => {
    expect(shiftDateISO("2026-08-16", 7)).toBe("2026-08-23");
    expect(shiftDateISO("2026-08-16", -7)).toBe("2026-08-09");
    expect(shiftDateISO("2026-08-30", 7)).toBe("2026-09-06");
    expect(shiftDateISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDateISO("2028-02-28", 1)).toBe("2028-02-29"); // leap year
  });
});

describe("buildWeekGrid", () => {
  const byDate = groupPostsByDate(POSTS);
  const cells = buildWeekGrid("2026-08-18", byDate, "2026-08-18");

  it("produces 7 Sunday-first cells for the anchor's week", () => {
    expect(cells).toHaveLength(7);
    expect(cells[0].dateISO).toBe("2026-08-16"); // Sunday
    expect(cells[6].dateISO).toBe("2026-08-22"); // Saturday
  });

  it("buckets posts onto their day and marks today", () => {
    const wed = cells.find((c) => c.dateISO === "2026-08-18");
    expect(wed?.isToday).toBe(true);
    // Aug 16–22 contains the Aug 20 post (c) but not the Aug 12 posts (a, b).
    const withPosts = cells.filter((c) => c.posts.length > 0);
    expect(withPosts.map((c) => c.dateISO)).toEqual(["2026-08-20"]);
    expect(cells.find((c) => c.dateISO === "2026-08-20")?.posts.map((p) => p.id)).toEqual([
      "c",
    ]);
  });

  it("excludes days outside the anchor week", () => {
    // Aug 12 (posts a, b) is the prior week — a week anchored there carries them.
    const priorWeek = buildWeekGrid("2026-08-12", byDate, "2026-08-18");
    const aug12 = priorWeek.find((c) => c.dateISO === "2026-08-12");
    expect(aug12?.posts.map((p) => p.id)).toEqual(["a", "b"]);
    // ...and none of Aug 16–22's posts leak into it.
    expect(priorWeek.some((c) => c.dateISO === "2026-08-20")).toBe(false);
  });
});

describe("weekRangeLabel", () => {
  it("labels a within-month week compactly", () => {
    expect(weekRangeLabel("2026-08-16")).toBe("Aug 16 – 22, 2026");
  });
  it("spells both months when the week straddles a boundary", () => {
    expect(weekRangeLabel("2026-08-30")).toBe("Aug 30 – Sep 5, 2026");
  });
  it("spells both years at a December→January turn", () => {
    expect(weekRangeLabel("2026-12-27")).toBe("Dec 27, 2026 – Jan 2, 2027");
  });
});

describe("rescheduledPost", () => {
  const p = post({ id: "x", scheduledFor: null, status: "approved" });

  it("dates a post and flips it to scheduled", () => {
    const next = rescheduledPost(p, "2026-08-25");
    expect(next).toMatchObject({ scheduledFor: "2026-08-25", status: "scheduled" });
    expect(p.scheduledFor).toBeNull(); // pure — original untouched
  });

  it("unschedules a post and flips it back to approved", () => {
    const dated = post({ id: "x", scheduledFor: "2026-08-25", status: "scheduled" });
    const next = rescheduledPost(dated, null);
    expect(next).toMatchObject({ scheduledFor: null, status: "approved" });
  });
});

describe("replacePost / removePost", () => {
  const list = [post({ id: "a" }), post({ id: "b" }), post({ id: "c" })];

  it("replaces one post by id, leaving the rest by reference", () => {
    const next = replacePost(list, "b", post({ id: "b", productName: "New" }));
    expect(next.map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(next[1].productName).toBe("New");
    expect(next[0]).toBe(list[0]); // untouched entries keep identity
  });

  it("is a no-op replacement when the id is absent", () => {
    const next = replacePost(list, "zzz", post({ id: "zzz" }));
    expect(next.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("removes one post by id", () => {
    expect(removePost(list, "b").map((p) => p.id)).toEqual(["a", "c"]);
    expect(removePost(list, "zzz").map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});

describe("scheduleRequestBody", () => {
  it("wraps a date and null identically to the endpoint contract", () => {
    expect(scheduleRequestBody("2026-08-25")).toEqual({ date: "2026-08-25" });
    expect(scheduleRequestBody(null)).toEqual({ date: null });
  });
});
