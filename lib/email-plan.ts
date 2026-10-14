/**
 * The Email Marketing Manager's calendar (SPEC-345) — pure. The month grid (weeks start
 * Monday), the week strip, slots by day, and the plan decisions: accept, reject with a
 * reason (the CI Plans shape: 10+ characters), move. Dates are local `YYYY-MM-DD` strings
 * so a slot never drifts a day across timezones.
 */
import type { Money, PlanSlot } from "@/types/email-marketing";

export type PlanView = "month" | "week";

export const REJECT_MIN = 10;

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

/** Monday of the week holding `value`. */
export function weekStart(value: string): string {
  const date = parseIsoDate(value);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return isoDate(date);
}

export interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

/** Whole weeks covering the month of `anchor`, Monday first. */
export function monthGrid(anchor: string, today: string): CalendarDay[][] {
  const first = parseIsoDate(anchor);
  first.setDate(1);
  const month = first.getMonth();
  const start = weekStart(isoDate(first));
  const weeks: CalendarDay[][] = [];
  let cursor = start;
  do {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = parseIsoDate(cursor);
      week.push({ date: cursor, day: date.getDate(), inMonth: date.getMonth() === month, isToday: cursor === today });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  } while (parseIsoDate(cursor).getMonth() === month);
  return weeks;
}

/** The seven days of the week holding `anchor`. */
export function weekDays(anchor: string, today: string): CalendarDay[] {
  const start = weekStart(anchor);
  const month = parseIsoDate(anchor).getMonth();
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, day: parseIsoDate(date).getDate(), inMonth: parseIsoDate(date).getMonth() === month, isToday: date === today };
  });
}

/** Move the anchor by one month or one week. */
export function shiftAnchor(anchor: string, view: PlanView, step: 1 | -1): string {
  if (view === "week") return addDays(anchor, 7 * step);
  const date = parseIsoDate(anchor);
  date.setDate(1);
  date.setMonth(date.getMonth() + step);
  return isoDate(date);
}

export function anchorLabel(anchor: string, view: PlanView): string {
  const date = parseIsoDate(anchor);
  if (view === "month") return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const start = parseIsoDate(weekStart(anchor));
  const end = parseIsoDate(addDays(weekStart(anchor), 6));
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function slotsByDate(slots: readonly PlanSlot[]): Map<string, PlanSlot[]> {
  const map = new Map<string, PlanSlot[]>();
  for (const slot of slots) {
    if (slot.state === "rejected") continue;
    const list = map.get(slot.date) ?? [];
    list.push(slot);
    map.set(slot.date, list);
  }
  return map;
}

export function rejectProblem(reason: string): string | null {
  return reason.trim().length >= REJECT_MIN ? null : `Say why in at least ${REJECT_MIN} characters, so the next plan learns from it.`;
}

/** Why a slot cannot move to `date` (the server refuses the same), or null. */
export function moveProblem(date: string, today: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Pick a day.";
  return date < today ? "A send cannot move into the past." : null;
}

export interface PlanTotals {
  proposed: number;
  accepted: number;
  rejected: number;
  acceptedProfit: Money;
  proposedProfit: Money;
}

export function planTotals(slots: readonly PlanSlot[]): PlanTotals {
  const currency = slots[0]?.expectedProfit.currency ?? "USD";
  const sum = (state: PlanSlot["state"]) =>
    slots.filter((slot) => slot.state === state).reduce((total, slot) => total + slot.expectedProfit.amount, 0);
  return {
    proposed: slots.filter((slot) => slot.state === "proposed").length,
    accepted: slots.filter((slot) => slot.state === "accepted").length,
    rejected: slots.filter((slot) => slot.state === "rejected").length,
    acceptedProfit: { amount: sum("accepted"), currency },
    proposedProfit: { amount: sum("proposed"), currency },
  };
}

export const REASON_LABELS: Record<PlanSlot["reasonKind"], string> = {
  occasion: "Occasion",
  season: "Season",
  stock: "Stock",
  repeat_clock: "Repeat clock",
  rhythm: "Reorder rhythm",
  content: "New content",
  health: "List health",
};
