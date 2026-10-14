/**
 * The payment run's in-browser half (SPEC-301). The backend chooses and orders the bills
 * and says why (backend SPEC-295); this only follows the owner's ticks: what each
 * company's account holds after each ticked bill, and what the whole run needs.
 *
 * Every figure here is a sum or difference of figures the backend sent — the cushion
 * that separates "tight" from "covered" is the backend's too. Pure, so Vitest proves it.
 */
import { formatCompactCurrency } from "@/utils/format";
import { shortDate } from "@/lib/finance";
import type { RunPlan, RunRow, WeekVerdict } from "@/types/finance";

export interface RunCompany {
  company: string;
  bank: number | null;
  cushion: number;
  need: number;
  bills: number;
  /** bank − need; null when the company has no bank account in QuickBooks. */
  left: number | null;
  verdict: WeekVerdict;
}

/** The ticks the run starts with: everything except what the backend held back. */
export function defaultPicks(plan: RunPlan): Set<string> {
  return new Set(plan.rows.filter((row) => row.selected).map((row) => row.bill.id));
}

export function toggled(picks: Set<string>, id: string): Set<string> {
  const next = new Set(picks);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Each company's position after paying every ticked bill in the run. */
export function runCompanies(plan: RunPlan, picks: Set<string>): RunCompany[] {
  return plan.companies.map(({ company, bank, cushion }) => {
    const mine = plan.rows.filter((r) => r.bill.company === company && picks.has(r.bill.id));
    const need = round2(mine.reduce((t, r) => t + r.bill.balance, 0));
    const left = bank === null ? null : round2(bank - need);
    const verdict: WeekVerdict =
      left === null ? "no_bank" : left < 0 ? "short" : left < cushion ? "tight" : "covered";
    return { company, bank, cushion, need, bills: mine.length, left, verdict };
  });
}

/** What each company's account holds after each ticked bill, in run order. An unticked
 * bill maps to null — it is not paid, so it moves nothing. */
export function cashAfter(plan: RunPlan, picks: Set<string>): Map<string, number | null> {
  const running = new Map<string, number | null>(plan.companies.map((c) => [c.company, c.bank]));
  const out = new Map<string, number | null>();
  for (const row of plan.rows) {
    if (!picks.has(row.bill.id)) {
      out.set(row.bill.id, null);
      continue;
    }
    const before = running.get(row.bill.company) ?? null;
    const after = before === null ? null : round2(before - row.bill.balance);
    running.set(row.bill.company, after);
    out.set(row.bill.id, after);
  }
  return out;
}

export function runTotal(plan: RunPlan, picks: Set<string>): { amount: number; bills: number } {
  const chosen = plan.rows.filter((r) => picks.has(r.bill.id));
  return { amount: round2(chosen.reduce((t, r) => t + r.bill.balance, 0)), bills: chosen.length };
}

/** Why a bill is in the run, as the owner reads it. */
export function reasonLabel(row: RunRow): { text: string; tone: "bad" | "good" | "warn" | "neutral" } {
  if (row.reason === "late") return { text: `${row.daysLate ?? 0}d late`, tone: "bad" };
  if (row.reason === "discount" && row.deadline && row.save != null) {
    return { text: `Save ${formatCompactCurrency(row.save)} by ${shortDate(row.deadline)}`, tone: "good" };
  }
  const due = row.dueIn ?? row.bill.days;
  if (due <= 0) return { text: "Due today", tone: "warn" };
  return { text: `Due ${shortDate(row.bill.dueOn)}`, tone: due <= 7 ? "warn" : "neutral" };
}

/** The run as plain text for the clipboard — what the owner pastes wherever he pays. */
export function runText(plan: RunPlan, picks: Set<string>): string {
  return plan.rows
    .filter((r) => picks.has(r.bill.id))
    .map(
      (r, i) =>
        `${i + 1}. ${r.bill.company} · ${r.bill.vendor} · ${r.bill.number} · $${r.bill.balance.toFixed(2)}`,
    )
    .join("\n");
}
