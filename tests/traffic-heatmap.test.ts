/** SPEC-113 — heatmap grid reshape + intensity buckets. */

import { describe, expect, it } from "vitest";

import { buildHeatmap, intensityClass } from "@/lib/traffic-heatmap";
import type { TrafficHeatCell } from "@/types/traffic";

const CELLS: TrafficHeatCell[] = [
  { weekday: 5, hour: 14, visitors: 100, transactions: 40, conversion_rate: 0.4 },
  { weekday: 5, hour: 15, visitors: 60, transactions: 30, conversion_rate: 0.5 },
  { weekday: 6, hour: 14, visitors: 20, transactions: 5, conversion_rate: 0.25 },
];

describe("buildHeatmap", () => {
  it("builds aligned rows across the union of hours, null where missing", () => {
    const g = buildHeatmap(CELLS);
    expect(g.hours).toEqual([14, 15]);
    expect(g.maxVisitors).toBe(100);
    const sat = g.rows.find((r) => r.weekday === 5)!;
    expect(sat.cells.map((c) => c?.visitors ?? null)).toEqual([100, 60]);
    const sun = g.rows.find((r) => r.weekday === 6)!;
    expect(sun.cells.map((c) => c?.visitors ?? null)).toEqual([20, null]); // no 15:00
  });

  it("empty input → empty grid", () => {
    expect(buildHeatmap([])).toEqual({ hours: [], rows: [], maxVisitors: 0 });
  });
});

describe("intensityClass", () => {
  it("buckets by ratio to the max; zero/empty is muted", () => {
    expect(intensityClass(0, 100)).toContain("bg-muted");
    expect(intensityClass(100, 100)).toContain("bg-primary/85");
    expect(intensityClass(10, 100)).toContain("bg-primary/15");
    expect(intensityClass(5, 0)).toContain("bg-muted");
  });
});
