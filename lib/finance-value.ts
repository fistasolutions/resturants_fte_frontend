/**
 * The Value tab's words and filters (SPEC-330 / backend SPEC-338) — pure, so what the page
 * says about somebody's money is provable in Vitest.
 *
 * One rule runs through all of it: **money from the books and money from assumptions are
 * never one unlabeled number.** The statement line names both; a tile built on an
 * assumption says so; the sample says it is a sample.
 */
import { financeHref } from "@/lib/finance";
import type {
  FinanceValue,
  Finding,
  FindingKind,
  FindingStatus,
  ValueAssumption,
} from "@/types/finance";
import { formatWholeMoney } from "@/utils/format";

export type LedgerFilter = "all" | "open" | "kept" | "lost" | "dismissed";

export const LEDGER_FILTERS: { key: LedgerFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "At stake" },
  { key: "kept", label: "Kept" },
  { key: "lost", label: "Lost" },
  { key: "dismissed", label: "Cleared" },
];

export function normalizeLedgerFilter(value: string | null | undefined): LedgerFilter {
  return LEDGER_FILTERS.some((f) => f.key === value) ? (value as LedgerFilter) : "all";
}

/** `closed` rows (no value either way) show under All only. */
export function filterLedger(rows: Finding[], filter: LedgerFilter): Finding[] {
  return filter === "all" ? rows : rows.filter((row) => row.status === filter);
}

export function ledgerCounts(rows: Finding[]): Record<LedgerFilter, number> {
  const counts: Record<LedgerFilter, number> = { all: rows.length, open: 0, kept: 0, lost: 0, dismissed: 0 };
  for (const row of rows) {
    if (row.status !== "closed") counts[row.status] += 1;
  }
  return counts;
}

export const KIND_LABEL: Record<FindingKind, string> = {
  discount: "Early-pay discount",
  duplicate: "Duplicate bill",
};

export type ValueTone = "success" | "warning" | "destructive" | "neutral";

/** What happened to a finding, in the owner's words — a duplicate is "stopped" or "paid
 * twice", a discount "kept" or "missed". */
export function statusLabel(kind: FindingKind, status: FindingStatus): { text: string; tone: ValueTone } {
  switch (status) {
    case "open":
      return { text: kind === "discount" ? "Open — pay in time" : "Caught — not paid yet", tone: "warning" };
    case "kept":
      return { text: kind === "discount" ? "Kept" : "Stopped", tone: "success" };
    case "lost":
      return { text: kind === "discount" ? "Missed" : "Paid twice", tone: "destructive" };
    case "dismissed":
      return { text: "Cleared", tone: "neutral" };
    case "closed":
      return { text: "Closed", tone: "neutral" };
  }
}

export function verifiedLabel(verified: Finding["verified"]): string | null {
  switch (verified) {
    case "amount":
      return "Paid less than the bill";
    case "timing":
      return "Paid inside the window";
    case "removed":
      return "A copy was removed before payment";
    default:
      return null;
  }
}

/** The money a row is about: its outcome once decided, its amount at stake while open. */
export function rowAmount(row: Finding): number {
  return row.outcome ?? row.amount;
}

/** "September 2026" from "2026-09", without a timezone shift. */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** A `?month=` the backend offered, or null (the current month). */
export function normalizeMonth(value: string | null | undefined, months: string[] = []): string | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  return months.length && !months.includes(value) ? null : value;
}

export function valueHref(month: string | null, filter: LedgerFilter = "all"): string {
  return financeHref("value", undefined, { month, view: filter === "all" ? null : filter });
}

/** What is at stake right now, in measured money (late fees are an estimate, apart). */
export function atStakeMeasured(value: FinanceValue): number {
  return value.atStake.discounts.amount + value.atStake.duplicates.amount;
}

/**
 * The one sentence at the top of the tab. Measured first, then the estimate named as one,
 * then the hours — or, when nothing has been kept yet, what is at stake instead of a $0
 * that reads like failure.
 */
export function statementLine(value: FinanceValue, current: boolean): string {
  const when = current ? "This month" : `In ${monthLabel(value.month)}`;
  const measured = value.headline.measured;
  const estimated = value.headline.estimated;
  const hours = value.headline.hours;
  const parts: string[] = [];
  if (measured > 0) parts.push(`${when} Finance kept ${formatWholeMoney(measured)} from your books`);
  if (estimated > 0) {
    parts.push(
      measured > 0
        ? `about ${formatWholeMoney(estimated)} more, estimated`
        : `${when} Finance is worth about ${formatWholeMoney(estimated)}, estimated`,
    );
  }
  if (parts.length) {
    const hoursText = hours >= 0.1 ? ` — about ${hours.toFixed(1)} hours of review` : "";
    return `${parts.join(", and ")}${hoursText}.`;
  }
  const stake = atStakeMeasured(value);
  if (stake > 0) return `Nothing kept yet ${current ? "this month" : "that month"} — ${formatWholeMoney(stake)} is at stake right now.`;
  return `Nothing to report ${current ? "yet this month" : "for that month"}.`;
}

const UNIT_SUFFIX: Record<ValueAssumption["unit"], string> = {
  usd_per_hour: "per hour",
  hours_per_week: "hours a week",
  percent: "%",
};

export function assumptionDisplay(a: ValueAssumption, value: number = a.value): string {
  if (a.unit === "usd_per_hour") return `${formatWholeMoney(value)} ${UNIT_SUFFIX[a.unit]}`;
  if (a.unit === "percent") return `${value}%`;
  return `${value} ${UNIT_SUFFIX[a.unit]}`;
}

export type ParsedInput = { ok: true; value: number } | { ok: false; error: string };

/** The owner's typed value, checked against the backend's own bounds before it is sent. */
export function parseAssumptionInput(raw: string, a: ValueAssumption): ParsedInput {
  const text = raw.trim().replace(/[$,%\s]/g, "");
  if (!text) return { ok: false, error: "Enter a number." };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, error: "Enter a number." };
  if (value < a.min || value > a.max) return { ok: false, error: `Between ${a.min} and ${a.max}.` };
  return { ok: true, value: Math.round(value * 100) / 100 };
}

/** Only the values that changed — an unchanged default is not saved as a choice. */
export function changedAssumptions(
  assumptions: ValueAssumption[],
  inputs: Record<string, string>,
): { values: Record<string, number>; errors: Record<string, string> } {
  const values: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const a of assumptions) {
    const raw = inputs[a.key];
    if (raw === undefined) continue;
    const parsed = parseAssumptionInput(raw, a);
    if (!parsed.ok) errors[a.key] = parsed.error;
    else if (parsed.value !== a.value) values[a.key] = parsed.value;
  }
  return { values, errors };
}

/** "Reason" for clearing a finding: the backend needs 3–200 characters. */
export function dismissReasonError(reason: string): string | null {
  const length = reason.trim().length;
  if (length < 3) return "Say why in a few words.";
  if (length > 200) return "Keep it under 200 characters.";
  return null;
}
