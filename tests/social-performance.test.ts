import { describe, expect, it } from "vitest";

import { barRows, funnelStages } from "@/lib/social-performance";
import type { SocialFunnel } from "@/types/social";

describe("funnelStages", () => {
  it("orders the five stages and sizes them relative to `generated`", () => {
    const funnel: SocialFunnel = {
      generated: 20,
      inReview: 10,
      approved: 8,
      scheduled: 4,
      published: 2,
    };
    const stages = funnelStages(funnel);
    expect(stages.map((s) => s.key)).toEqual([
      "generated",
      "inReview",
      "approved",
      "scheduled",
      "published",
    ]);
    expect(stages.map((s) => s.label)).toEqual([
      "Generated",
      "In review",
      "Approved",
      "Scheduled",
      "Published",
    ]);
    expect(stages.map((s) => s.count)).toEqual([20, 10, 8, 4, 2]);
    expect(stages.map((s) => s.percent)).toEqual([100, 50, 40, 20, 10]);
  });

  it("is all-zero (no divide-by-zero) when nothing has been generated", () => {
    const empty: SocialFunnel = {
      generated: 0,
      inReview: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
    };
    expect(funnelStages(empty).every((s) => s.percent === 0)).toBe(true);
  });
});

describe("barRows", () => {
  it("sizes each row against the largest count", () => {
    const rows = barRows(
      [
        { channel: "instagram", count: 10 },
        { channel: "tiktok", count: 5 },
        { channel: "facebook", count: 0 },
      ],
      (c) => c.count,
    );
    expect(rows.map((r) => r.percent)).toEqual([100, 50, 0]);
    expect(rows[0].item.channel).toBe("instagram");
  });

  it("returns an empty array for empty input", () => {
    expect(barRows([], (n: number) => n)).toEqual([]);
  });

  it("handles an all-zero set without dividing by zero", () => {
    const rows = barRows([{ count: 0 }, { count: 0 }], (c) => c.count);
    expect(rows.map((r) => r.percent)).toEqual([0, 0]);
  });
});
