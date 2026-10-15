/**
 * The Ops Coach's pure half (frontend SPEC-385 over backend SPEC-402): the focuses in the order the
 * coach ranks them, their labels, filtering, and the one-line facts under a brief. Every figure is
 * the backend's.
 */
import type { CoachBrief, CoachFocus } from "@/types/restaurant-os";

export const COACH_FOCUSES: CoachFocus[] = ["silent", "late", "voids", "labor", "sales", "ticket", "on_track"];

export const COACH_FOCUS_LABELS: Record<CoachFocus, string> = {
  silent: "No orders recorded",
  late: "Late deliveries",
  voids: "Voids",
  labor: "Labor",
  sales: "Sales down",
  ticket: "Average ticket",
  on_track: "On track",
};

export function needsAction(focus: CoachFocus): boolean {
  return focus !== "on_track";
}

/** The briefs under one focus, or all of them; the backend's order (most urgent first) is kept. */
export function filterBriefs(briefs: CoachBrief[], focus: CoachFocus | "all" | "action"): CoachBrief[] {
  if (focus === "all") return briefs;
  if (focus === "action") return briefs.filter((b) => needsAction(b.focus));
  return briefs.filter((b) => b.focus === focus);
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** "−12% vs last week" or null when there is nothing to compare with. */
export function changeLabel(change: number | null): string | null {
  if (change == null) return null;
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";
  return `${sign}${pct(Math.abs(change))} vs last week`;
}

/** The facts worth a glance, in the coach's order, each already worded. */
export function factLine(facts: CoachBrief["facts"], money: (v: number) => string): string[] {
  const parts = [`${money(facts.netSales)} sales`, `${facts.transactions} orders`];
  const change = changeLabel(facts.change);
  if (change) parts.push(change);
  if (facts.deliveriesTimed > 0 && facts.onTimeRate != null) parts.push(`${pct(facts.onTimeRate)} on time`);
  if (facts.laborPct != null) parts.push(`labor ${pct(facts.laborPct)}`);
  if (facts.voids > 0) parts.push(`${facts.voids} void${facts.voids === 1 ? "" : "s"}`);
  return parts;
}

/** Briefs that can still be emailed: a GM email on file and not sent yet. */
export function emailable(briefs: CoachBrief[]): number {
  return briefs.filter((b) => b.hasManagerEmail && !b.emailedAt).length;
}
