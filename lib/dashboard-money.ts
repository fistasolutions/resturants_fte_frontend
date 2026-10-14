/**
 * Money at stake — the three cards above the Dashboard (SPEC-237 / backend SPEC-244).
 *
 * Pure: tone, which lines show and which fold, the sub-line under each line and the
 * missing-sources sentence are all decided here, in the layer Vitest covers, so the
 * component only lays cards out. Nothing is calculated — every amount and total
 * arrives already summed by the backend (root Rule 8); this formats and picks a tone.
 */

import type { StripTone } from "@/lib/kpi-strip";
import type {
  DashboardMoney,
  DashboardMoneyKey,
  DashboardMoneyLine,
  DashboardMoneyNumber,
} from "@/types/dashboard";
import { formatCurrency, formatNumber } from "@/utils/format";

/** How many lines a card shows before folding the rest behind "+ N more". */
export const VISIBLE_LINES = 2;

/** Tone by number, not by size: trapped and at-risk warn, leaked is already gone. */
const TONE_BY_KEY: Record<DashboardMoneyKey, StripTone> = {
  trapped: "warn",
  leaking: "bad",
  at_risk: "warn",
};

export interface MoneyCardLine {
  key: string;
  label: string;
  /** "$479,355.84 · 692 orders" — the Brief shows cents everywhere, so does this. */
  sub: string;
  action: string;
  href: string;
}

export interface MoneyCard {
  key: DashboardMoneyKey;
  title: string;
  question: string;
  /** "$2,105,687.45" */
  total: string;
  /** Neutral when the number has no lines — a real zero looks like good news. */
  tone: StripTone;
  lines: MoneyCardLine[];
  /** Lines folded behind "+ N more"; 0 when every line is visible. */
  hidden: number;
  /** True when the backend found nothing for this number. */
  empty: boolean;
}

/** "$479,355.84 · 692 orders" — the amount, then what it is made of. */
export function lineSub(line: DashboardMoneyLine): string {
  return `${formatCurrency(line.amount)} · ${formatNumber(line.count)} ${line.unit}`;
}

export function buildMoneyCard(number: DashboardMoneyNumber): MoneyCard {
  const empty = number.lines.length === 0;
  const visible = number.lines.slice(0, VISIBLE_LINES);
  return {
    key: number.key,
    title: number.title,
    question: number.question,
    total: formatCurrency(number.total),
    tone: empty ? "neutral" : TONE_BY_KEY[number.key],
    lines: visible.map((line) => ({
      key: line.key,
      label: line.label,
      sub: lineSub(line),
      action: line.action,
      href: line.href,
    })),
    hidden: Math.max(0, number.lines.length - VISIBLE_LINES),
    empty,
  };
}

export function buildMoneyCards(money: DashboardMoney): MoneyCard[] {
  return money.numbers.map(buildMoneyCard);
}

/**
 * "2 sources could not be read — figures are partial", or null when every producer
 * answered. Unknown is not zero (root Rule 6): a missing source is named, never
 * rendered as $0.
 */
export function missingSourcesNote(money: DashboardMoney): string | null {
  const n = money.sources_missing.length;
  if (n === 0) return null;
  return `${n} source${n === 1 ? "" : "s"} could not be read — figures are partial`;
}
