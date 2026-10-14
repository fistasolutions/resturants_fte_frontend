import type { TaxReportIssue, TaxReportRow, TaxReportSummary } from "@/types/tax-report";

/** Column order is a contract, not a layout preference — it must match the
 *  Excel file the client's accounting team already uses (backend SPEC-170). */
export const TAX_REPORT_COLUMNS = [
  "Month",
  "Sales Channel",
  "POS Location Name",
  "Taxable Sales",
  "Non-Taxable Sales",
  "Total Sales",
  "Total Tax Rate (%)",
  "Tax 1 Amount",
  "Tax 2 Amount",
  "Tax 3 Amount",
] as const satisfies readonly (keyof TaxReportRow)[];

export const CURRENCY_COLUMNS = new Set<keyof TaxReportRow>([
  "Taxable Sales",
  "Non-Taxable Sales",
  "Total Sales",
  "Tax 1 Amount",
  "Tax 2 Amount",
  "Tax 3 Amount",
]);

/** Tokens only — `--brand` is deliberately NOT used for status: it is
 *  identity-only and would collide with `--destructive` (Rule 9). */
export function statusTone(reconciled: boolean): string {
  return reconciled
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : "bg-destructive/10 text-destructive";
}

/** Signed, 2dp, never rounded to zero — a discrepancy of -$0.004 must not
 *  render as "0.00" and look reconciled. */
export function formatDifference(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return String(value);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(2)}`;
}

/** Rate keeps three decimals: 8.625% must not display as 8.63%. */
export function formatRate(value: number): string {
  return `${value.toFixed(3)}%`;
}

/** Newest period first. Sorts by (year, month, first_day) rather than by the
 *  generated timestamp, so a regenerated old report does not jump to the top. */
export function sortReportsNewestFirst(reports: TaxReportSummary[]): TaxReportSummary[] {
  return [...reports].sort(
    (a, b) => b.year - a.year || b.month - a.month || b.first_day - a.first_day,
  );
}

/** A one-line reason for the history row, so "REVIEW REQUIRED" is never
 *  presented without a cause. */
export function issueSummary(issues: TaxReportIssue[]): string {
  if (issues.length === 0) return "";
  const [first] = issues;
  return issues.length === 1 ? first.area : `${first.area} +${issues.length - 1} more`;
}

export interface PeriodOption {
  key: string;
  year: number;
  month: number;
  period: "first" | "second";
  label: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Last day of a month — handles leap years, mirroring the backend's
 *  `calendar.monthrange` so a manual run offers the same ranges the scheduled
 *  one produces. */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Periods a person can sensibly generate today, newest first.
 *
 * A period is only offered once it has actually finished: offering
 * "August 1-22" on August 10th would produce a half-empty report that looks
 * like a data problem rather than an incomplete month.
 */
export function generatablePeriods(today: Date, count = 12): PeriodOption[] {
  const options: PeriodOption[] = [];
  let year = today.getFullYear();
  let month = today.getMonth() + 1; // 1-indexed
  const day = today.getDate();

  while (options.length < count) {
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    const last = lastDayOfMonth(year, month);

    // Second period: only once the month has ended.
    if (!isCurrentMonth) {
      options.push({
        key: `${year}-${month}-second`,
        year,
        month,
        period: "second",
        label: `${MONTH_NAMES[month - 1]} 23-${last} ${year}`,
      });
    }
    // First period: only from the 23rd of that month onward.
    if (!isCurrentMonth || day >= 23) {
      options.push({
        key: `${year}-${month}-first`,
        year,
        month,
        period: "first",
        label: `${MONTH_NAMES[month - 1]} 1-22 ${year}`,
      });
    }
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return options.slice(0, count);
}
