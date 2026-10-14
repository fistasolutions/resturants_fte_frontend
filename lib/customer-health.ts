/**
 * Customers → Health (SPEC-247, backend SPEC-253) — the pure bits of the view: the
 * badge class per tone, the summary tiles, the coverage line and how each platform
 * cell reads. Every figure and verdict arrives computed (root Rule 8); this formats.
 */

import type { CustomerHealthData, CustomerHealthRow } from "@/types/customers";
import { formatCompactCurrency, formatNumber, formatPercent } from "@/utils/format";

export type HealthTone = CustomerHealthRow["verdictTone"];

const BADGE_BY_TONE: Record<HealthTone, string> = {
  bad: "bg-destructive/10 text-destructive",
  warn: "bg-warning/10 text-warning",
  neutral: "bg-muted text-foreground",
  good: "bg-success/10 text-success",
};

export function healthBadgeClass(tone: HealthTone): string {
  return BADGE_BY_TONE[tone];
}

export interface HealthTile {
  key: string;
  label: string;
  value: string;
  /** The money line under the count, when the verdict carries one. */
  sub: string | null;
  tone: HealthTone | "plain";
}

/** How the window reads (SPEC-365): a full year, or since the store's first order. */
export interface HealthSpan {
  /** "in 12 months" / "since 9 Sep" — after a figure. */
  within: string;
  /** "a year at stake" / "at stake since 9 Sep". */
  atStake: string;
  /** "of the last 12 months" / "since 9 Sep" — after "Top spenders". */
  basis: string;
}

export const FULL_YEAR: HealthSpan = {
  within: "in 12 months",
  atStake: "a year at stake",
  basis: "of the last 12 months",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** The window's words: a full year, or "since 9 Sep" for a store with less history. */
export function healthSpan(data: Pick<CustomerHealthData, "windowDays" | "coveredDays" | "coveredSince">): HealthSpan {
  if (data.coveredDays >= data.windowDays || !data.coveredSince) return FULL_YEAR;
  const since = new Date(`${data.coveredSince}T00:00:00Z`);
  const day = `${since.getUTCDate()} ${MONTHS[since.getUTCMonth()]}`;
  return { within: `since ${day}`, atStake: `at stake since ${day}`, basis: `since ${day}` };
}

/** Reviewed first, then every verdict in the backend's order. */
export function healthTiles(summary: CustomerHealthData["summary"], span: HealthSpan = FULL_YEAR): HealthTile[] {
  return [
    {
      key: "reviewed",
      label: "Top customers reviewed",
      value: formatNumber(summary.customers),
      sub: `${formatCompactCurrency(summary.spendReviewed)} ${span.within}`,
      tone: "plain",
    },
    { key: "open_issue", label: "Open problem", value: formatNumber(summary.openIssue), sub: null, tone: "warn" },
    {
      key: "going_quiet",
      label: "Going quiet",
      value: formatNumber(summary.goingQuiet),
      sub: summary.goingQuiet > 0 || summary.openIssue > 0 ? `${formatCompactCurrency(summary.atStake)} ${span.atStake}` : null,
      tone: "neutral",
    },
    {
      key: "draining",
      label: "Draining",
      value: formatNumber(summary.draining),
      sub: summary.draining > 0 ? `${formatCompactCurrency(summary.refundedByDraining)} sent back` : null,
      tone: "bad",
    },
    { key: "healthy", label: "Healthy", value: formatNumber(summary.healthy), sub: null, tone: "good" },
  ];
}

/** Which platforms' columns and words Health shows (SPEC-365). A full organization (FOC) shows
 * both, as before; a guided one only what it has connected. */
export interface HealthSources {
  loop: boolean;
  gorgias: boolean;
}

export const ALL_SOURCES: HealthSources = { loop: true, gorgias: true };

/** The basis line: window, the email match, and how far the ticket match can reach. */
export function coverageLine(data: CustomerHealthData, sources: HealthSources = ALL_SOURCES): string {
  const span = healthSpan(data);
  const head =
    span === FULL_YEAR ? `Top spenders of the last ${Math.round(data.windowDays / 30)} months` : `Top spenders ${span.basis}`;
  const coverage =
    data.summary.ticketEmailCoveragePct === null
      ? "no tickets in the window"
      : `${formatPercent(data.summary.ticketEmailCoveragePct)} of tickets carry one`;
  const matched = [sources.loop ? "Loop returns" : null, sources.gorgias ? "Gorgias tickets" : null].filter(Boolean);
  const matching = matched.length
    ? ` ${matched.join(" and ")} ${matched.length > 1 ? "are" : "is"} matched on the customer's email${sources.gorgias ? ` (${coverage})` : ""}.`
    : " Returns and tickets join the table once Loop or Gorgias is connected.";
  return `${head}. Refunds are Shopify's ledger;${matching} Going quiet is the same rule as the winback list.`;
}

/** "153 d ago · ~10 d" — days since the last order and the usual gap when known. */
export function lastOrderCell(c: CustomerHealthRow): string {
  const since =
    c.daysSinceLastOrder <= 0 ? "today" : c.daysSinceLastOrder === 1 ? "yesterday" : `${formatNumber(c.daysSinceLastOrder)} d ago`;
  return c.avgGapDays === null ? since : `${since} · ~${formatNumber(Math.round(c.avgGapDays))} d`;
}

/** "57 · 57%" — refunds and the share of spend they took back; "—" when none. */
export function refundsCell(c: CustomerHealthRow): string {
  if (c.refunds === 0) return "—";
  return c.refundPct === null ? formatNumber(c.refunds) : `${formatNumber(c.refunds)} · ${formatPercent(c.refundPct)}`;
}

export interface CountCell {
  text: string;
  /** True when something is open right now — rendered in the warning tone. */
  open: boolean;
}

/** "3 (1 open)" / "2" / "—". */
export function countCell(total: number, open: number): CountCell {
  if (total === 0) return { text: "—", open: false };
  return open > 0
    ? { text: `${formatNumber(total)} (${formatNumber(open)} open)`, open: true }
    : { text: formatNumber(total), open: false };
}

export function returnsCell(c: CustomerHealthRow): CountCell {
  return countCell(c.loopReturns, c.loopOpen);
}

export function ticketsCell(c: CustomerHealthRow): CountCell {
  return countCell(c.tickets, c.openTickets);
}
