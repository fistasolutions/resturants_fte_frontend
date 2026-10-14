import { describe, expect, it } from "vitest";

import {
  BRAND_BRAIN_STALE_DAYS,
  brandBrainFreshness,
} from "@/lib/brand-brain-freshness";

const NOW = Date.parse("2026-08-18T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

describe("brandBrainFreshness", () => {
  it("reads confirmations as fresh with human relative phrasing", () => {
    expect(brandBrainFreshness(daysAgo(0), NOW)).toMatchObject({ days: 0, relative: "today", stale: false });
    expect(brandBrainFreshness(daysAgo(1), NOW).relative).toBe("yesterday");
    expect(brandBrainFreshness(daysAgo(5), NOW).relative).toBe("5 days ago");
    expect(brandBrainFreshness(daysAgo(10), NOW).relative).toBe("1 week ago");
    expect(brandBrainFreshness(daysAgo(21), NOW).relative).toBe("3 weeks ago");
  });

  it("flags stale only at/after the threshold", () => {
    expect(brandBrainFreshness(daysAgo(BRAND_BRAIN_STALE_DAYS - 1), NOW).stale).toBe(false);
    expect(brandBrainFreshness(daysAgo(BRAND_BRAIN_STALE_DAYS), NOW).stale).toBe(true);
    expect(brandBrainFreshness(daysAgo(45), NOW).relative).toBe("1 month ago");
    expect(brandBrainFreshness(daysAgo(75), NOW).relative).toBe("2 months ago");
  });

  it("never returns negative days for a future/clock-skewed stamp", () => {
    expect(brandBrainFreshness(daysAgo(-3), NOW)).toMatchObject({ days: 0, stale: false });
  });

  it("degrades gracefully on an unparseable timestamp", () => {
    expect(brandBrainFreshness("not-a-date", NOW)).toMatchObject({ relative: "recently", stale: false });
  });
});
