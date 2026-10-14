/**
 * SPEC-172 — publish controls and performance presentation.
 *
 * The load-bearing test here is `metricLabel(null) === "—"`. The backend stores
 * NULL when Meta didn't report a metric, because "we don't know" and "it got
 * none" are different facts (backend SPEC-182). A future `?? 0` anywhere in the
 * UI would erase that distinction and poison every average built on top of it —
 * this is the test that catches it.
 */

import { describe, expect, it } from "vitest";

import {
  canPublishNow,
  engagementRows,
  isPublishing,
  isUnreported,
  metricLabel,
  normalizeScheduleTime,
  publishButtonLabel,
  scheduleTimeError,
  type EngagementTotals,
} from "@/lib/social-publish";

const EMPTY: EngagementTotals = {
  reach: null,
  impressions: null,
  likes: null,
  comments: null,
  saves: null,
  shares: null,
};

describe("canPublishNow", () => {
  it.each(["approved", "scheduled"])(
    "offers publish from %s with an image, once publishing is possible",
    (status) => {
      expect(canPublishNow(status, true, true)).toBe(true);
    },
  );

  it.each(["in_review", "changes_requested", "published", "publishing"])(
    "hides publish for %s",
    (status) => {
      expect(canPublishNow(status, true, true)).toBe(false);
    },
  );

  it("hides publish when there is no image, whatever the status", () => {
    // Instagram has no text-only post; finding that out from a failed publish is
    // worse than never seeing the button.
    expect(canPublishNow("approved", false, true)).toBe(false);
    expect(canPublishNow("scheduled", false, true)).toBe(false);
  });

  it("hides publish entirely in manual-first mode — the SPEC-184 guard", () => {
    // `publishReady` is false whenever Meta isn't connected, the public image URL
    // isn't set, or Instagram isn't linked. This is the store's state today, and
    // the button must not render at all rather than render and fail.
    expect(canPublishNow("approved", true, false)).toBe(false);
    expect(canPublishNow("scheduled", true, false)).toBe(false);
  });
});

describe("isPublishing", () => {
  it("recognises the in-flight claim state", () => {
    expect(isPublishing("publishing")).toBe(true);
    expect(isPublishing("approved")).toBe(false);
  });
});

describe("publishButtonLabel", () => {
  it("reads as pending while in flight", () => {
    expect(publishButtonLabel(true, false)).toBe("Publishing…");
  });

  it("offers a retry after a previous failure", () => {
    expect(publishButtonLabel(false, true)).toBe("Retry publish");
  });

  it("is a plain publish otherwise", () => {
    expect(publishButtonLabel(false, false)).toBe("Publish now");
  });
});

describe("metricLabel", () => {
  it("renders an unreported metric as a dash, NOT zero", () => {
    expect(metricLabel(null)).toBe("—");
    expect(metricLabel(null)).not.toBe("0");
  });

  it("renders a real zero as zero", () => {
    // The other half of the same rule: a measured 0 is a fact worth showing.
    expect(metricLabel(0)).toBe("0");
  });

  it("formats large numbers readably", () => {
    expect(metricLabel(12400)).toBe("12,400");
  });
});

describe("isUnreported", () => {
  it("separates absent from zero", () => {
    expect(isUnreported(null)).toBe(true);
    expect(isUnreported(0)).toBe(false);
  });
});

describe("engagementRows", () => {
  it("returns every metric in display order", () => {
    expect(engagementRows(EMPTY).map((row) => row.key)).toEqual([
      "reach",
      "impressions",
      "likes",
      "comments",
      "saves",
      "shares",
    ]);
  });

  it("preserves nulls rather than defaulting them to 0", () => {
    const rows = engagementRows({ ...EMPTY, reach: 500 });
    expect(rows.find((row) => row.key === "reach")?.value).toBe(500);
    expect(rows.find((row) => row.key === "saves")?.value).toBeNull();
    expect(rows.some((row) => row.value === 0)).toBe(false);
  });
});

describe("scheduleTimeError", () => {
  it("accepts an empty time — omitting it is valid", () => {
    expect(scheduleTimeError("")).toBeNull();
    expect(scheduleTimeError("   ")).toBeNull();
  });

  it.each(["19:30", "00:00", "9:05", "23:59"])("accepts %s", (value) => {
    expect(scheduleTimeError(value)).toBeNull();
  });

  it.each(["25:00", "12:75", "7pm", "1930", "noon"])("rejects %s", (value) => {
    expect(scheduleTimeError(value)).not.toBeNull();
  });
});

describe("normalizeScheduleTime", () => {
  it("pads to HH:MM", () => {
    expect(normalizeScheduleTime("9:05")).toBe("09:05");
  });

  it("returns null for empty or invalid input", () => {
    expect(normalizeScheduleTime("")).toBeNull();
    expect(normalizeScheduleTime("25:00")).toBeNull();
  });
});
