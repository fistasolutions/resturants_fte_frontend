/** SPEC-112 Patches — per-store series → chart rows reshape. */

import { describe, expect, it } from "vitest";

import { storeVisitorsChart } from "@/lib/traffic-chart";
import type { TrafficStoreDaily } from "@/types/traffic";

const SD: TrafficStoreDaily = {
  dates: ["2026-08-04", "2026-08-05"],
  stores: [
    { store_code: "Jackson", location: "Jackson", visitors_in: [50, 30], visitors_out: [48, 35] },
    { store_code: "Lawrence", location: "Lawrence", visitors_in: [20, 25], visitors_out: [18, 24] },
  ],
};

describe("storeVisitorsChart", () => {
  it("pivots aligned arrays into one row per date keyed by store", () => {
    const { rows } = storeVisitorsChart(SD);
    expect(rows).toEqual([
      { date: "2026-08-04", Jackson: 50, Lawrence: 20 },
      { date: "2026-08-05", Jackson: 30, Lawrence: 25 },
    ]);
  });

  it("assigns each store a stable chart color", () => {
    const { series } = storeVisitorsChart(SD);
    expect(series).toEqual([
      { key: "Jackson", color: "var(--chart-1)" },
      { key: "Lawrence", color: "var(--chart-2)" },
    ]);
  });

  it("can pivot the walk-out metric instead", () => {
    const { rows } = storeVisitorsChart(SD, "visitors_out");
    expect(rows[0]).toEqual({ date: "2026-08-04", Jackson: 48, Lawrence: 18 });
  });

  it("handles an empty series", () => {
    const { rows, series } = storeVisitorsChart({ dates: [], stores: [] });
    expect(rows).toEqual([]);
    expect(series).toEqual([]);
  });
});
