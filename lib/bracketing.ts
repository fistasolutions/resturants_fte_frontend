/**
 * The Bracketing tab's page logic (SPEC-309) — pure. Words and orders figures the backend
 * computed (SPEC-306); decides nothing about any customer.
 */
import type { BracketChannel, BracketStyle, BracketSummary } from "@/types/bracketing";

export const BRACKET_PAGE_SIZE = 25;

export const CHANNEL_LABEL: Record<BracketChannel, string> = {
  online: "Online",
  in_store: "In store",
  other: "Other channels",
};

export interface OutcomeSegment {
  key: "keptAll" | "keptOne" | "keptSome" | "returnedAll";
  label: string;
  count: number;
  /** Share of brackets, 0–100, rounded; the four add to 100. */
  pct: number;
}

/** How brackets end, as four segments whose percentages add to exactly 100. */
export function outcomeSplit(s: Pick<BracketSummary, "brackets" | "keptAll" | "keptOne" | "keptSome" | "returnedAll">): OutcomeSegment[] {
  const parts: Omit<OutcomeSegment, "pct">[] = [
    { key: "keptAll", label: "Kept all", count: s.keptAll },
    { key: "keptOne", label: "Kept one", count: s.keptOne },
    { key: "keptSome", label: "Kept some", count: s.keptSome },
    { key: "returnedAll", label: "Returned all", count: s.returnedAll },
  ];
  if (!s.brackets) return parts.map((p) => ({ ...p, pct: 0 }));
  const raw = parts.map((p) => (p.count / s.brackets) * 100);
  const floored = raw.map(Math.floor);
  let left = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, rem: v - Math.floor(v) })).sort((a, b) => b.rem - a.rem);
  for (const { i } of order) {
    if (left <= 0) break;
    floored[i] += 1;
    left -= 1;
  }
  return parts.map((p, i) => ({ ...p, pct: floored[i] }));
}

export type BracketSortKey = "refunded" | "bracketOrders" | "bracketRate" | "keptOne" | "orders" | "title";

/** Stable; a missing figure always sinks. */
export function sortBracketStyles(rows: BracketStyle[], key: BracketSortKey, dir: 1 | -1): BracketStyle[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      if (key === "title") return dir * a.row.title.localeCompare(b.row.title) || a.index - b.index;
      const av = a.row[key];
      const bv = b.row[key];
      if (av === null && bv === null) return a.index - b.index;
      if (av === null) return 1;
      if (bv === null) return -1;
      return dir * (av - bv) || a.index - b.index;
    })
    .map((e) => e.row);
}

export function nextSort(current: { key: BracketSortKey; dir: 1 | -1 }, key: BracketSortKey): { key: BracketSortKey; dir: 1 | -1 } {
  if (current.key === key) return { key, dir: current.dir === 1 ? -1 : 1 };
  return { key, dir: key === "title" ? 1 : -1 };
}

export function pageRows<T>(rows: T[], page: number, size = BRACKET_PAGE_SIZE): { rows: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((current - 1) * size, current * size), page: current, pages };
}

/** "0.0579" → "5.8%"; null → "—". */
export function pctText(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits).replace(/\.0$/, "")}%`;
}
