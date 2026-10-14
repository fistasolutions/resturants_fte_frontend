/** Pure reshape of the flat weekday×hour cells into a dense grid for the Peak
 * Hours heatmap (SPEC-113). Framework-free / unit-tested; the view only renders. */

import type { TrafficHeatCell } from "@/types/traffic";

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface HeatmapCell {
  visitors: number;
  transactions: number;
  conversion_rate: number | null;
}

export interface HeatmapGrid {
  /** Sorted hour columns that actually have footfall. */
  hours: number[];
  /** One row per weekday present, cells aligned to `hours` (null = no data). */
  rows: { weekday: number; cells: (HeatmapCell | null)[] }[];
  maxVisitors: number;
}

export function buildHeatmap(cells: TrafficHeatCell[]): HeatmapGrid {
  const hours = [...new Set(cells.map((c) => c.hour))].sort((a, b) => a - b);
  const weekdays = [...new Set(cells.map((c) => c.weekday))].sort((a, b) => a - b);
  const byKey = new Map(cells.map((c) => [`${c.weekday}:${c.hour}`, c]));
  const maxVisitors = cells.reduce((m, c) => Math.max(m, c.visitors), 0);
  const rows = weekdays.map((weekday) => ({
    weekday,
    cells: hours.map((h) => {
      const c = byKey.get(`${weekday}:${h}`);
      return c
        ? {
            visitors: c.visitors,
            transactions: c.transactions,
            conversion_rate: c.conversion_rate,
          }
        : null;
    }),
  }));
  return { hours, rows, maxVisitors };
}

/** Fixed Tailwind opacity buckets (token-based, no hardcoded colors) for a
 * cell's footfall intensity relative to the grid max. */
export function intensityClass(visitors: number, maxVisitors: number): string {
  if (maxVisitors <= 0 || visitors <= 0) return "bg-muted/40 text-muted-foreground";
  const ratio = visitors / maxVisitors;
  if (ratio < 0.25) return "bg-primary/15";
  if (ratio < 0.5) return "bg-primary/35";
  if (ratio < 0.75) return "bg-primary/55 text-primary-foreground";
  return "bg-primary/85 text-primary-foreground";
}
