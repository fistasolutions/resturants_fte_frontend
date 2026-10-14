import type { ReportPeriod } from "@/types/reports";

/** Normalize the `?period=` URL param (D-08). Anything other than the two
 * rollup values collapses to "daily" — the default stored report. */
export function normalizePeriod(value: string | undefined): ReportPeriod {
  return value === "weekly" || value === "monthly" ? value : "daily";
}
