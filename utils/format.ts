/**
 * Display formatting only — metrics arrive computed from the backend
 * (root CLAUDE.md Rule 8). Nothing here derives business values.
 *
 * Money is in the store's currency and instants in the store's timezone (SPEC-319), read from
 * `lib/store-locale.ts` — USD / America/New_York until a workspace says otherwise.
 */
import { getStoreLocale } from "@/lib/store-locale";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function moneyFormatter(kind: "full" | "compact" | "whole"): Intl.NumberFormat {
  const { currency } = getStoreLocale();
  const key = `${kind}:${currency}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      ...(kind === "compact" ? { notation: "compact" as const, maximumFractionDigits: 1 } : {}),
      ...(kind === "whole" ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter;
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatCurrency(value: number): string {
  return moneyFormatter("full").format(value);
}

/** Short axis/summary form, e.g. "$24.1K". */
export function formatCompactCurrency(value: number): string {
  return moneyFormatter("compact").format(value);
}

/** Rounded to the whole unit, e.g. "$1,235". */
export function formatWholeMoney(value: number): string {
  return moneyFormatter("whole").format(value);
}

/** The store currency's symbol as the app writes it, e.g. "$", "£", "CA$". */
export function currencySymbol(): string {
  return (
    moneyFormatter("whole")
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? getStoreLocale().currency
  );
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** 34.2 → "34.2%". Accepts an already-percent value (0–100). */
export function formatPercent(value: number): string {
  return `${numberFormatter.format(Number(value.toFixed(1)))}%`;
}

/** Signed delta for comparisons: 12.5 → "+12.5%", -3.2 → "-3.2%". */
export function formatChange(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPercent(value)}`;
}

/** The store's timezone — every INSTANT timestamp renders here so times read in
 * store time regardless of the viewer's machine clock (SPEC-129), per store (SPEC-319). */
export function storeTimeZone(): string {
  return getStoreLocale().timeZone;
}

/** A bare calendar date with no time component, e.g. "2026-05-15" — represents a
 * day, not a moment, so it must NOT be zone-shifted (would go off-by-one). */
function isDateOnly(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso.trim());
}

/** ISO → "May 15, 2026". A datetime instant renders its store-time calendar
 * date; a date-only string renders its literal date (no zone shift). */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const dateOnly = isDateOnly(iso);
  const d = new Date(dateOnly ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    // date-only: literal calendar date (local midnight, no shift); instant: store time.
    ...(dateOnly ? {} : { timeZone: storeTimeZone() }),
  });
}

/** ISO instant → "10:30 AM" in store time. */
export function formatTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: storeTimeZone(),
  });
}

/** ISO instant → "Aug 12, 2026, 10:17 PM" in store time — for combined
 * date+time rows (transactions, alerts, activity, sync status). */
export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: storeTimeZone(),
  });
}

/** "John Smith" → "JS"; "Admin" → "AD". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Time-of-day greeting: 5–11 morning, 12–17 afternoon, otherwise evening — in `timeZone`
 * when given (the store's, SPEC-319), else the clock this runs on. */
export function getGreeting(date: Date, timeZone?: string): string {
  let hour = date.getHours();
  if (timeZone) {
    try {
      hour =
        Number(
          new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(date),
        ) % 24;
    } catch {
      // An unknown zone keeps the local hour.
    }
  }
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Next report run, rendered in the store's zone (SPEC-031):
 * "Jul 18, 9:30 AM (America/New_York)". Invalid zones fall back to UTC. */
export function formatNextRun(iso: string, timezone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  try {
    return `${date.toLocaleString("en-US", { ...options, timeZone: timezone })} (${timezone})`;
  } catch {
    return `${date.toLocaleString("en-US", { ...options, timeZone: "UTC" })} (UTC)`;
  }
}
