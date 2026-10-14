/**
 * SPEC-173 — post-detail action and messaging rules.
 *
 * The load-bearing test is `scheduleMessage`. On 2026-08-28 the running page read
 * "Approve it and it auto-schedules for Aug 26, 2026" — a date two days gone. A
 * message that commits the system to something impossible is worse than none, and
 * nothing in the suite would have caught it.
 */

import { describe, expect, it } from "vitest";

import { primaryAction, reasonLine, scheduleMessage } from "@/lib/social-post";

describe("primaryAction", () => {
  it.each(["in_review", "changes_requested"])(
    "offers Approve while %s is still in review",
    (status) => {
      expect(primaryAction(status)).toBe("approve");
    },
  );

  it.each(["approved", "scheduled"])(
    "offers 'I posted it' once %s has cleared review",
    (status) => {
      expect(primaryAction(status)).toBe("mark-posted");
    },
  );

  it.each(["published", "publishing"])("offers nothing for %s", (status) => {
    expect(primaryAction(status)).toBe("none");
  });

  it("never offers two primaries for one status", () => {
    // The whole point: one action at a time, so there is no question what's next.
    const statuses = [
      "in_review",
      "changes_requested",
      "approved",
      "scheduled",
      "published",
    ];
    for (const status of statuses) {
      expect(["approve", "mark-posted", "none"]).toContain(primaryAction(status));
    }
  });
});

describe("scheduleMessage", () => {
  it("promises the date while it is still ahead", () => {
    const message = scheduleMessage("2026-09-03", "2026-08-28");
    expect(message).not.toBeNull();
    expect(message?.stale).toBe(false);
    expect(message?.text).toContain("Approving schedules it for");
  });

  it("says so when the planned date has already passed", () => {
    // The exact case seen on the running page.
    const message = scheduleMessage("2026-08-26", "2026-08-28");
    expect(message?.stale).toBe(true);
    expect(message?.text).toContain("has passed");
    expect(message?.text).not.toContain("Approving schedules it for");
  });

  it("treats today as still valid", () => {
    expect(scheduleMessage("2026-08-28", "2026-08-28")?.stale).toBe(false);
  });

  it("says nothing for an unplanned draft", () => {
    expect(scheduleMessage(null, "2026-08-28")).toBeNull();
  });

  it("compares bare days as strings so no timezone shifts the answer", () => {
    expect(scheduleMessage("2026-01-01", "2026-12-31")?.stale).toBe(true);
    expect(scheduleMessage("2026-12-31", "2026-01-01")?.stale).toBe(false);
  });
});

describe("reasonLine", () => {
  it("joins the signal and its grounded number", () => {
    expect(reasonLine("best_seller", "1,805 sold in 90 days")).toBe(
      "Best seller · 1,805 sold in 90 days",
    );
  });

  it.each([
    ["dead_stock", "Aging stock"],
    ["high_margin", "High margin"],
    ["trending", "Trending"],
    ["new_arrival", "New arrival"],
  ])("labels %s in the owner's words", (token, label) => {
    expect(reasonLine(token, null)).toBe(label);
  });

  it("degrades an unknown signal rather than hiding it", () => {
    // A new backend signal must never become silently invisible on the page.
    expect(reasonLine("seasonal_peak", null)).toBe("Seasonal peak");
  });

  it("shows the detail alone when there is no signal", () => {
    expect(reasonLine(null, "Added today")).toBe("Added today");
  });

  it("returns null rather than an empty label when the row has neither", () => {
    expect(reasonLine(null, null)).toBeNull();
    expect(reasonLine(null, "   ")).toBeNull();
  });
});
