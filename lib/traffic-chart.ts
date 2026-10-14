/** Pure reshape of the backend per-store daily series into Recharts rows +
 * a series list (SPEC-112 Patches). Framework-free so it's unit-testable; the
 * chart component only renders what this returns. */

import type { TrafficStoreDaily } from "@/types/traffic";

const STORE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export interface StoreChartSeries {
  key: string;
  color: string;
}

export interface StoreChartData {
  /** One row per date: { date, [store location]: value }. */
  rows: Array<Record<string, string | number>>;
  series: StoreChartSeries[];
}

/** Pivot the aligned per-store arrays into per-date rows keyed by store name,
 * assigning each store a stable chart color. `metric` picks walk-ins or -outs. */
export function storeVisitorsChart(
  storeDaily: TrafficStoreDaily,
  metric: "visitors_in" | "visitors_out" = "visitors_in",
): StoreChartData {
  const series = storeDaily.stores.map((store, i) => ({
    key: store.location,
    color: STORE_COLORS[i % STORE_COLORS.length],
  }));
  const rows = storeDaily.dates.map((date, di) => {
    const row: Record<string, string | number> = { date };
    for (const store of storeDaily.stores) {
      row[store.location] = store[metric][di] ?? 0;
    }
    return row;
  });
  return { rows, series };
}
