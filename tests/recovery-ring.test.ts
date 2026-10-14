import { describe, expect, it } from "vitest";

import { circumference, clampPct, dashArray } from "@/lib/recovery-ring";

describe("recovery ring math", () => {
  it("clamps pct into [0,100] and rounds", () => {
    expect(clampPct(-10)).toBe(0);
    expect(clampPct(150)).toBe(100);
    expect(clampPct(52.4)).toBe(52);
    expect(clampPct(Number.NaN)).toBe(0);
  });

  it("computes circumference", () => {
    expect(circumference(10)).toBeCloseTo(62.83, 1);
  });

  it("splits the dash array into filled + gap summing to the circumference", () => {
    const r = 40;
    const c = circumference(r);
    const [filled, gap] = dashArray(50, r).split(" ").map(Number);
    expect(filled).toBeCloseTo(c / 2, 1);
    expect(filled + gap).toBeCloseTo(c, 1);
  });

  it("full and empty arcs", () => {
    const r = 40;
    const c = circumference(r);
    const [full, fullGap] = dashArray(100, r).split(" ").map(Number);
    expect(full).toBeCloseTo(c, 1);
    expect(fullGap).toBeCloseTo(0, 1);
    const [empty] = dashArray(0, r).split(" ").map(Number);
    expect(empty).toBeCloseTo(0, 1);
  });
});
