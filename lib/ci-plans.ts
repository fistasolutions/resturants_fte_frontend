/**
 * CI Plans (SPEC-272) — the pure half of `/ci/plans`: adapters over backend
 * SPEC-271's JSON, the status vocabulary, filtering and counting the cards, the
 * effort and decision lines, and the two validations the dialogs run before a
 * request leaves the browser. No fetch, no React — Vitest covers it.
 */

import type { CiPlan, CiPlanList, PlanCounts, PlanDraft, PlanStatus } from "@/types/ci-plans";

/* ── API shapes ─────────────────────────────────────────────────────────── */

export interface ApiCiPlan {
  id: number;
  title: string;
  memo: string;
  why: string;
  gets: string[];
  effort_days: number | null;
  where_it_lives: string;
  value: string;
  status: PlanStatus;
  created_by_name: string | null;
  decided_by_name: string | null;
  decided_at: string | null;
  reject_reason: string | null;
  reject_instead: string | null;
  accept_note?: string | null;
  has_image: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApiCiPlanList {
  plans: ApiCiPlan[];
  counts: PlanCounts;
  effort_awaiting_days: number;
}

export function toCiPlan(api: ApiCiPlan): CiPlan {
  return {
    id: api.id,
    title: api.title,
    memo: api.memo,
    why: api.why,
    gets: api.gets ?? [],
    effortDays: api.effort_days,
    whereItLives: api.where_it_lives ?? "",
    value: api.value,
    status: api.status,
    createdByName: api.created_by_name,
    decidedByName: api.decided_by_name,
    decidedAt: api.decided_at,
    rejectReason: api.reject_reason,
    rejectInstead: api.reject_instead,
    acceptNote: api.accept_note ?? null,
    hasImage: api.has_image,
    createdAt: api.created_at ?? "",
  };
}

export function toCiPlanList(api: ApiCiPlanList): CiPlanList {
  return {
    plans: api.plans.map(toCiPlan),
    counts: {
      awaiting: api.counts?.awaiting ?? 0,
      accepted: api.counts?.accepted ?? 0,
      rejected: api.counts?.rejected ?? 0,
    },
    effortAwaitingDays: api.effort_awaiting_days ?? 0,
  };
}

/* ── vocabulary ─────────────────────────────────────────────────────────── */

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  awaiting: "Awaiting your decision",
  accepted: "Accepted",
  rejected: "Rejected",
};

export type PlanFilter = "all" | PlanStatus;

export const PLAN_FILTERS: { key: PlanFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "awaiting", label: "Awaiting" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

export function isPlanFilter(value: string | null): value is PlanFilter {
  return value === "all" || value === "awaiting" || value === "accepted" || value === "rejected";
}

export function filterPlans(plans: CiPlan[], filter: PlanFilter): CiPlan[] {
  return filter === "all" ? plans : plans.filter((p) => p.status === filter);
}

/** Counts from the cards themselves — the tiles agree with the grid even mid-refetch. */
export function planCounts(plans: CiPlan[]): PlanCounts {
  const counts: PlanCounts = { awaiting: 0, accepted: 0, rejected: 0 };
  for (const p of plans) counts[p.status] += 1;
  return counts;
}

export function effortAwaiting(plans: CiPlan[]): number {
  return plans.reduce((sum, p) => (p.status === "awaiting" ? sum + (p.effortDays ?? 0) : sum), 0);
}

/** 4 → "4 days" · 2.5 → "2.5 days" · 1 → "1 day" · null → "—". */
export function formatEffort(days: number | null): string {
  if (days === null || Number.isNaN(days)) return "—";
  const rounded = Math.round(days * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} ${rounded === 1 ? "day" : "days"}`;
}

/** "~11 days" for the tile; "—" when nothing is awaiting. */
export function formatEffortOnTable(days: number): string {
  return days > 0 ? `~${formatEffort(days)}` : "—";
}

/** The card's closing line: who decided and when, or the invitation. */
export function decisionLine(plan: CiPlan, formatDate: (iso: string) => string): string {
  if (plan.status === "awaiting") return "Open to decide";
  const who = plan.decidedByName ?? "the owner";
  const when = plan.decidedAt ? ` on ${formatDate(plan.decidedAt)}` : "";
  return plan.status === "accepted" ? `Accepted by ${who}${when}` : `Rejected by ${who}${when}`;
}

/* ── validation ─────────────────────────────────────────────────────────── */

export const REJECT_MIN_CHARS = 10;

export interface RejectionProblems {
  reason: string | null;
  instead: string | null;
}

/** Both texts are required, ≥ 10 characters after trimming — mirrors the backend. */
export function rejectionProblems(reason: string, instead: string): RejectionProblems {
  const short = (text: string) => text.trim().length < REJECT_MIN_CHARS;
  return {
    reason: short(reason) ? `Tell us why not — at least ${REJECT_MIN_CHARS} characters.` : null,
    instead: short(instead) ? `Describe how it should look — at least ${REJECT_MIN_CHARS} characters.` : null,
  };
}

export function rejectionValid(reason: string, instead: string): boolean {
  const problems = rejectionProblems(reason, instead);
  return problems.reason === null && problems.instead === null;
}

/** The note on a Yes is optional — only its length is checked (SPEC-278). */
export const ACCEPT_NOTE_MAX = 4000;

export function noteProblem(note: string): string | null {
  return note.trim().length > ACCEPT_NOTE_MAX ? `Keep the note under ${ACCEPT_NOTE_MAX} characters.` : null;
}

/** Textarea → bullets: one per non-empty line, leading "-"/"•" stripped, at most 12. */
export function parseGets(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 12);
}

/** "4" → 4 · "2.5" → 2.5 · "" → null · "abc" / "-1" / "400" → undefined (invalid). */
export function parseEffort(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > 365) return undefined;
  return Math.round(value * 10) / 10;
}

export type DraftProblems = Partial<Record<keyof PlanDraft, string>>;

/** The dialog's own check before a request; the backend validates again. */
export function draftProblems(draft: PlanDraft): DraftProblems {
  const problems: DraftProblems = {};
  if (draft.title.trim().length < 3) problems.title = "Give the plan a title.";
  if (draft.why.trim().length < 3) problems.why = "Say why now.";
  if (parseGets(draft.gets).length === 0) problems.gets = "List at least one thing he gets.";
  if (parseEffort(draft.effortDays) === undefined) problems.effortDays = "Days, 0–365, or leave it empty.";
  // SPEC-278 Patches: "in one line" and "the value" are optional — an empty memo
  // becomes the first bullet on the backend.
  return problems;
}

/** Whether the form's collapsed Details row has anything in it to show at once. */
export function hasDetails(draft: PlanDraft, hasImage = false): boolean {
  return draft.whereItLives.trim() !== "" || draft.effortDays.trim() !== "" || hasImage;
}

export function draftValid(draft: PlanDraft): boolean {
  return Object.keys(draftProblems(draft)).length === 0;
}

export const EMPTY_DRAFT: PlanDraft = {
  title: "",
  memo: "",
  why: "",
  gets: "",
  whereItLives: "",
  value: "",
  effortDays: "",
};

export function draftFromPlan(plan: CiPlan): PlanDraft {
  return {
    title: plan.title,
    memo: plan.memo,
    why: plan.why,
    gets: plan.gets.join("\n"),
    whereItLives: plan.whereItLives,
    value: plan.value,
    effortDays: plan.effortDays === null ? "" : String(plan.effortDays),
  };
}

/** The wire body the dialog sends — snake_case, bullets parsed, effort as a number. */
export function draftToBody(draft: PlanDraft): Record<string, unknown> {
  return {
    title: draft.title.trim(),
    memo: draft.memo.trim(),
    why: draft.why.trim(),
    gets: parseGets(draft.gets),
    value: draft.value.trim(),
    where_it_lives: draft.whereItLives.trim(),
    effort_days: parseEffort(draft.effortDays) ?? null,
  };
}
