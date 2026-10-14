/** SPEC-301 — chart geometry: ticks name values the axis reaches, nothing leaves the plot. */
import { describe, expect, it } from "vitest";

import { cashGeometry, niceTicks, scale, trendGeometry, type Box } from "@/lib/finance-charts";

const BOX: Box = { width: 500, height: 200, top: 10, right: 10, bottom: 20, left: 40 };

describe("ticks and scales", () => {
  it("rounds to human steps that cover the data", () => {
    expect(niceTicks(0, 53460, 4)).toEqual([0, 20000, 40000, 60000]);
    expect(niceTicks(-16199.9, 21640.1, 4)).toEqual([-20000, -10000, 0, 10000, 20000, 30000]);
    expect(niceTicks(5, 5)).toEqual([5]);
  });

  it("maps a domain onto a range, inverted for SVG y", () => {
    const y = scale([0, 100], [180, 10]);
    expect(y(0)).toBe(180);
    expect(y(100)).toBe(10);
    expect(y(50)).toBe(95);
  });
});

describe("the trend", () => {
  it("needs two points to draw a line", () => {
    expect(trendGeometry([{ date: "2026-09-24", outstanding: 1, pastDue: 0 }], BOX)).toBeNull();
  });

  it("keeps every point inside the plot", () => {
    const geo = trendGeometry(
      [
        { date: "2026-09-17", outstanding: 30000, pastDue: 3120 },
        { date: "2026-09-24", outstanding: 53460, pastDue: 39960 },
      ],
      BOX,
    );
    expect(geo).not.toBeNull();
    for (const p of geo!.points) {
      expect(p.x).toBeGreaterThanOrEqual(BOX.left);
      expect(p.x).toBeLessThanOrEqual(BOX.width - BOX.right);
      expect(p.owedY).toBeGreaterThanOrEqual(BOX.top);
      expect(p.lateY).toBeLessThanOrEqual(BOX.height - BOX.bottom);
    }
    expect(geo!.owed.startsWith("M")).toBe(true);
  });
});

describe("the cash chart", () => {
  const weeks = [
    { week: 0, takings: 0, billsDue: 37840, balance: -16199.9, belowCushion: true },
    { week: 1, takings: 0, billsDue: 0, balance: -16199.9, belowCushion: true },
  ];
  it("runs the axis below zero only when a week is overdrawn, and draws bars up from zero", () => {
    const geo = cashGeometry(weeks, 21640.1, 8000, BOX);
    expect(geo.ticks[0].value).toBeLessThan(0);
    const bill = geo.bars[0];
    expect(bill.outY + bill.outH).toBeCloseTo(geo.zeroY, 5);
    expect(geo.dots.every((d) => d.below)).toBe(true);
    expect(geo.line.startsWith(`M${BOX.left.toFixed(1)},`)).toBe(true);
  });

  it("stays above zero when nothing is overdrawn", () => {
    const geo = cashGeometry([{ week: 0, takings: 100, billsDue: 50, balance: 1050, belowCushion: false }], 1000, 500, BOX);
    expect(geo.ticks[0].value).toBe(0);
  });
});
