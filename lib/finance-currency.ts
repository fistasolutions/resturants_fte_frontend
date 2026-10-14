/**
 * Finance Oversight for any organization (SPEC-331 / backend SPEC-339) — pure.
 *
 * The words for the reporting currency and the rates behind it, the original amount of a
 * converted bill, the owner's rate input, and the typed confirmation that guards
 * disconnecting every company at once.
 */
import { shortDate } from "@/lib/finance";
import type { Bill, ConnectionsOverview, FxRate } from "@/types/finance";

/** What the owner types to disconnect every company — the enterprise guard for an
 * action that removes several sets of books at once. */
export const DISCONNECT_WORD = "DISCONNECT";

export function confirmsDisconnect(typed: string): boolean {
  return typed.trim().toUpperCase() === DISCONNECT_WORD;
}

/** "All figures in USD" — or nothing when the backend did not say (an older server). */
export function reportingLine(overview: Pick<ConnectionsOverview, "reportingCurrency">): string | null {
  return overview.reportingCurrency ? `All figures in ${overview.reportingCurrency}` : null;
}

/** "CAD → USD 0.7342 · QuickBooks, Oct 1" / "· your rate, Oct 1". */
export function rateLabel(rate: FxRate, reporting: string): string {
  const source = rate.source === "owner" ? "your rate" : "QuickBooks";
  return `${rate.currency} → ${reporting} ${trimRate(rate.rate)} · ${source}, ${shortDate(rate.asOf)}`;
}

function trimRate(rate: number): string {
  return Number(rate.toFixed(6)).toString();
}

/** The companies held out for want of a rate, and the currencies each needs. */
export function waitingForRates(overview: Pick<ConnectionsOverview, "connections">): {
  company: string;
  currencies: string[];
}[] {
  return overview.connections
    .filter((row) => row.fxMissing.length > 0)
    .map((row) => ({ company: row.companyName, currencies: row.fxMissing }));
}

/** "CAD 12,400.00 at 0.7342" under a converted bill; null when nothing was converted (a
 * rate of 1, or a bill read before backend SPEC-339 kept originals). */
export function originalLine(bill: Pick<Bill, "currency" | "originalBalance" | "fxRate">): string | null {
  if (!bill.currency || bill.originalBalance == null || bill.fxRate == null || bill.fxRate === 1) return null;
  return `${formatIn(bill.originalBalance, bill.currency)} at ${trimRate(bill.fxRate)}`;
}

function formatIn(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code" }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export type ParsedRate = { ok: true; value: number } | { ok: false; error: string };

/** `1 CAD = ? USD`, checked before it is sent: a positive number below a million with at
 * most six decimals — the backend's own bounds. */
export function parseRateInput(raw: string): ParsedRate {
  const text = raw.trim().replace(/,/g, "");
  if (!text) return { ok: false, error: "Enter the rate." };
  if (!/^\d*\.?\d+$/.test(text)) return { ok: false, error: "Enter a number, such as 0.7342." };
  const value = Number(text);
  if (!(value > 0)) return { ok: false, error: "The rate must be more than 0." };
  if (value >= 1_000_000) return { ok: false, error: "That rate is too large." };
  const decimals = text.includes(".") ? text.split(".")[1].length : 0;
  if (decimals > 6) return { ok: false, error: "Use at most six decimal places." };
  return { ok: true, value };
}
