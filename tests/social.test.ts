import { describe, expect, it } from "vitest";

import { SOCIAL_TAB_IDS, normalizeSocialTab } from "@/lib/social";
// Every tab is now live (backend SPEC-123 + SPEC-131) and covered by backend
// tests; the service imports server-only serverApi, so this node-env suite
// asserts the Vitest fixtures (which mirror the live shapes) directly.
import { mockCalendar, mockPerformance } from "@/lib/mock/social";
import { readyToSchedule, scheduledPosts } from "@/lib/social-calendar";

describe("normalizeSocialTab", () => {
  it("passes through every valid tab id", () => {
    for (const id of SOCIAL_TAB_IDS) {
      expect(normalizeSocialTab(id)).toBe(id);
    }
  });

  it("falls back to overview for unknown / empty values", () => {
    expect(normalizeSocialTab("bogus")).toBe("overview");
    expect(normalizeSocialTab(null)).toBe("overview");
    expect(normalizeSocialTab(undefined)).toBe("overview");
    expect(normalizeSocialTab("")).toBe("overview");
  });
});

describe("social live-shape fixtures (Calendar + Performance)", () => {
  it("calendar posts carry both scheduled and ready buckets", () => {
    expect(mockCalendar.posts.length).toBeGreaterThan(0);
    expect(scheduledPosts(mockCalendar.posts).length).toBeGreaterThan(0);
    expect(readyToSchedule(mockCalendar.posts).length).toBeGreaterThan(0);
    // Every post declares a valid status and a matching date presence.
    for (const p of mockCalendar.posts) {
      expect(["approved", "scheduled"]).toContain(p.status);
      if (p.status === "scheduled") expect(p.scheduledFor).not.toBeNull();
      else expect(p.scheduledFor).toBeNull();
    }
  });

  it("performance has a funnel, breakdowns, and an honest zero attribution state", () => {
    const { funnel, byChannel, contentMix, attribution, platformConnected } =
      mockPerformance;
    expect(funnel.generated).toBeGreaterThanOrEqual(funnel.published);
    expect(byChannel.length).toBeGreaterThan(0);
    expect(contentMix.length).toBeGreaterThan(0);
    // Attribution starts empty until tracked links convert — no fabricated data.
    expect(attribution.windowDays).toBe(90);
    expect(attribution.topPosts).toEqual([]);
    expect(attribution.attributedRevenue).toBe(0);
    // Reach/engagement gated off until a channel is connected.
    expect(platformConnected).toBe(false);
  });
});
