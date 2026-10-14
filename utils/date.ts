/**
 * Period/comparison date helpers for the dashboard controls. Pure and
 * UTC-based so labels are stable regardless of the viewer's timezone.
 */

export type ComparisonMode = "previous_day" | "previous_week" | "previous_month";

/**
 * `label` names the period being VIEWED (the backend's rolling window ending
 * today); `shortLabel` names what its KPI deltas compare against.
 */
export const COMPARISON_OPTIONS: Record<
  ComparisonMode,
  { label: string; shortLabel: string }
> = {
  previous_day: { label: "Today", shortLabel: "vs yesterday (same time)" },
  previous_week: { label: "Last 7 days", shortLabel: "vs last week" },
  previous_month: { label: "Last 30 days", shortLabel: "vs last month" },
};

export function isComparisonMode(value: unknown): value is ComparisonMode {
  return typeof value === "string" && value in COMPARISON_OPTIONS;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidISODate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  // Reject overflow dates like 2026-02-31 (which Date rolls forward).
  return parsed.toISOString().slice(0, 10) === value;
}

/**
 * The comparison date for a period: -1 day, -7 days, or -1 calendar month
 * (clamped to the target month's last day, e.g. May 31 → Apr 30).
 */
export function comparisonDate(dateISO: string, mode: ComparisonMode): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  if (mode === "previous_day") {
    date.setUTCDate(date.getUTCDate() - 1);
  } else if (mode === "previous_week") {
    date.setUTCDate(date.getUTCDate() - 7);
  } else {
    const day = date.getUTCDate();
    date.setUTCMonth(date.getUTCMonth() - 1);
    if (date.getUTCDate() !== day) {
      // Overflowed into the original month — clamp to the target month's end.
      date.setUTCDate(0);
    }
  }
  return date.toISOString().slice(0, 10);
}

/** Local-safe Date → "YYYY-MM-DD" (calendar pickers return local midnight). */
export function dateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
