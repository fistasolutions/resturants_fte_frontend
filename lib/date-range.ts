/**
 * Date-range presets + comparison helpers for the Shopify-style picker
 * (SPEC-037). Pure and UTC-based so results are identical in any timezone.
 * The backend computes the authoritative comparison window (backend
 * SPEC-031) — `compareRangeFor` mirrors its math for display labels only.
 */

import { isValidISODate } from "@/utils/date";

export type RangePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "90d"
  | "mtd"
  | "qtd"
  | "ytd"
  | "bfcm";

export type CompareMode = "previous_period" | "previous_year" | "hebrew_year" | "none";

export interface DateRange {
  /** ISO date, inclusive. */
  from: string;
  to: string;
}

export interface ResolvedRange extends DateRange {
  /** The matched preset, or null for a custom range. */
  preset: RangePreset | null;
  /** Human label — the preset name or "Jun 1 – Jul 1, 2026". */
  label: string;
}

// ── UTC date arithmetic ──────────────────────────────────────────────────────

function parseUTC(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const date = parseUTC(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISO(date);
}

/** Whole days between two ISO dates (to − from). */
export function diffDays(from: string, to: string): number {
  return Math.round((parseUTC(to).getTime() - parseUTC(from).getTime()) / 86_400_000);
}

function yearEarlier(iso: string): string {
  const date = parseUTC(iso);
  const month = date.getUTCMonth();
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  if (date.getUTCMonth() !== month) {
    // Feb 29 rolled into March — clamp to Feb 28 (backend SPEC-031 parity).
    date.setUTCDate(0);
  }
  return toISO(date);
}

// ── Black Friday / Cyber Monday ──────────────────────────────────────────────

/** Black Friday of a year: the day after November's 4th Thursday. */
export function blackFriday(year: number): string {
  const nov1 = new Date(Date.UTC(year, 10, 1));
  const THURSDAY = 4;
  const firstThursday = 1 + ((THURSDAY - nov1.getUTCDay() + 7) % 7);
  const fourthThursday = firstThursday + 21;
  return toISO(new Date(Date.UTC(year, 10, fourthThursday + 1)));
}

/** The most recent BFCM window (Fri → Mon) that has started by `todayISO`. */
export function bfcmRange(todayISO: string): DateRange {
  const year = parseUTC(todayISO).getUTCFullYear();
  const thisYears = blackFriday(year);
  const from = todayISO >= thisYears ? thisYears : blackFriday(year - 1);
  return { from, to: addDays(from, 3) };
}

// ── presets ──────────────────────────────────────────────────────────────────

function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function quarterStart(iso: string): string {
  const month = Number(iso.slice(5, 7));
  const quarterMonth = String(Math.floor((month - 1) / 3) * 3 + 1).padStart(2, "0");
  return `${iso.slice(0, 4)}-${quarterMonth}-01`;
}

export const RANGE_PRESETS: Record<
  RangePreset,
  { label: string; resolve: (todayISO: string) => DateRange }
> = {
  today: { label: "Today", resolve: (t) => ({ from: t, to: t }) },
  yesterday: {
    label: "Yesterday",
    resolve: (t) => ({ from: addDays(t, -1), to: addDays(t, -1) }),
  },
  "7d": { label: "Last 7 days", resolve: (t) => ({ from: addDays(t, -6), to: t }) },
  "30d": { label: "Last 30 days", resolve: (t) => ({ from: addDays(t, -29), to: t }) },
  "90d": { label: "Last 90 days", resolve: (t) => ({ from: addDays(t, -89), to: t }) },
  mtd: { label: "Month to date", resolve: (t) => ({ from: monthStart(t), to: t }) },
  qtd: { label: "Quarter to date", resolve: (t) => ({ from: quarterStart(t), to: t }) },
  ytd: { label: "Year to date", resolve: (t) => ({ from: `${t.slice(0, 4)}-01-01`, to: t }) },
  bfcm: { label: "Black Friday–Cyber Monday", resolve: bfcmRange },
};

export function isRangePreset(value: unknown): value is RangePreset {
  return typeof value === "string" && value in RANGE_PRESETS;
}

// ── compare modes ────────────────────────────────────────────────────────────

export const COMPARE_MODES: Record<
  CompareMode,
  { label: string; shortLabel: string | null }
> = {
  previous_period: { label: "Previous period", shortLabel: "vs previous period" },
  previous_year: { label: "Last year (same dates)", shortLabel: "vs last year" },
  // SPEC-307 — the same Hebrew dates one Hebrew year earlier (backend SPEC-305), so a
  // festival is compared with the same festival last year.
  hebrew_year: { label: "Last year (Hebrew calendar)", shortLabel: "vs same festival last year" },
  none: { label: "No comparison", shortLabel: null },
};

/** The order the comparison picker lists the modes in. */
export const COMPARE_MODE_ORDER: CompareMode[] = [
  "previous_period",
  "previous_year",
  "hebrew_year",
  "none",
];

/** Legacy SPEC-028 compare values map to their preset equivalents (Rule 7). */
const LEGACY_COMPARE_PRESETS: Record<string, RangePreset> = {
  previous_day: "today",
  previous_week: "7d",
  previous_month: "30d",
};

/**
 * `?compare=` → a mode. Given the organization's calendar (SPEC-318), `hebrew_year` is honoured
 * only on the Hebrew calendar — elsewhere it reads as the same dates last year, because the
 * backend refuses it (`calendar_query`) and an old link must still open the page. Without the
 * argument the value is taken as it is.
 */
export function resolveCompareMode(value: unknown, calendar?: string | null): CompareMode {
  if (typeof value === "string" && value in COMPARE_MODES) {
    const mode = value as CompareMode;
    if (mode === "hebrew_year" && calendar !== undefined && calendar !== "hebrew") {
      return "previous_year";
    }
    return mode;
  }
  return "previous_period";
}

/** The modes the Compare menu offers an organization (SPEC-318). */
export function compareModesFor(calendar: string | null): CompareMode[] {
  return calendar === "hebrew"
    ? COMPARE_MODE_ORDER
    : COMPARE_MODE_ORDER.filter((mode) => mode !== "hebrew_year");
}

/**
 * Display-only mirror of the backend's comparison window (SPEC-031):
 * `previous_period` = trailing same-length window, `previous_year` = same
 * dates a year earlier, `none` = null. `hebrew_year` is null too: the Hebrew
 * calendar is the backend's (SPEC-305), and its answer carries the exact dates.
 */
export function compareRangeFor(
  from: string,
  to: string,
  mode: CompareMode,
): DateRange | null {
  if (mode === "none" || mode === "hebrew_year") return null;
  if (mode === "previous_year") {
    return { from: yearEarlier(from), to: yearEarlier(to) };
  }
  const length = diffDays(from, to) + 1;
  return { from: addDays(from, -length), to: addDays(from, -1) };
}

// ── URL param resolution ─────────────────────────────────────────────────────

export interface RangeParams {
  range?: string;
  from?: string;
  to?: string;
  /** Legacy single-date param (SPEC-028 URLs). */
  date?: string;
  /** Only read for LEGACY values, which imply a preset (SPEC-028 URLs). */
  compare?: string;
}

/**
 * URL params → concrete range. Precedence: valid `from`+`to` pair (clamped
 * to today, swapped if inverted) → `range` preset → legacy `date` →
 * legacy `compare` preset → default `today` (owner feedback 2026-07-21:
 * landing on the dashboard must show TODAY, like Shopify).
 */
export function resolveDateRange(params: RangeParams, todayISO: string): ResolvedRange {
  if (
    params.from &&
    params.to &&
    isValidISODate(params.from) &&
    isValidISODate(params.to)
  ) {
    let from = params.from > todayISO ? todayISO : params.from;
    let to = params.to > todayISO ? todayISO : params.to;
    if (from > to) [from, to] = [to, from];
    return { from, to, preset: null, label: formatRangeLabel(from, to) };
  }
  if (isRangePreset(params.range)) {
    const { from, to } = RANGE_PRESETS[params.range].resolve(todayISO);
    return { from, to, preset: params.range, label: RANGE_PRESETS[params.range].label };
  }
  if (params.date && isValidISODate(params.date)) {
    const day = params.date > todayISO ? todayISO : params.date;
    return { from: day, to: day, preset: null, label: formatRangeLabel(day, day) };
  }
  const legacy = params.compare ? LEGACY_COMPARE_PRESETS[params.compare] : undefined;
  const preset: RangePreset = legacy ?? "today";
  const { from, to } = RANGE_PRESETS[preset].resolve(todayISO);
  return { from, to, preset, label: RANGE_PRESETS[preset].label };
}

// ── labels ───────────────────────────────────────────────────────────────────

const MONTH_DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const MONTH_DAY_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Jul 1, 2026", "Jun 1 – Jul 1, 2026", or "Nov 28, 2025 – Jan 5, 2026". */
export function formatRangeLabel(from: string, to: string): string {
  const fromDate = parseUTC(from);
  const toDate = parseUTC(to);
  if (from === to) return MONTH_DAY_YEAR.format(fromDate);
  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${MONTH_DAY.format(fromDate)} – ${MONTH_DAY_YEAR.format(toDate)}`;
  }
  return `${MONTH_DAY_YEAR.format(fromDate)} – ${MONTH_DAY_YEAR.format(toDate)}`;
}
