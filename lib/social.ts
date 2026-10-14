/**
 * Social Growth — pure, unit-testable display logic (SPEC-110). No JSX, no
 * data; shared by the tab bar, the persistent shell, the page route, and the
 * tab components so the tab vocabulary and the engagement scale have exactly
 * one definition. Sibling to `lib/spotlight.ts`.
 */

/** The five Social Growth tabs, in bar order. `?tab=` values map 1:1 to these. */
export const SOCIAL_TAB_IDS = [
  "overview",
  "content-studio",
  "calendar",
  "approvals",
  "performance",
] as const;

export type SocialTab = (typeof SOCIAL_TAB_IDS)[number];

export const SOCIAL_TAB_LABELS: Record<SocialTab, string> = {
  overview: "Overview",
  "content-studio": "Content Studio",
  calendar: "Calendar",
  approvals: "Approvals",
  performance: "Performance",
};

/** Coerce an untrusted `?tab=` value to a real tab; unknown → "overview". */
export function normalizeSocialTab(value: string | null | undefined): SocialTab {
  return SOCIAL_TAB_IDS.includes(value as SocialTab)
    ? (value as SocialTab)
    : "overview";
}

/* ── Approvals card state machine (SPEC-132) ──────────────────────────────
 * The Approvals featured card closes the Generate → Approve → Schedule loop:
 * pending → approved → scheduled. This is the single source of truth for which
 * actions each state exposes, so the component stays declarative and the state
 * machine is unit-testable in the node-env Vitest suite (no component runner).
 * The `changes` decision was removed entirely in SPEC-178 — a two-person review
 * handoff in a one-person product. */
export type ApprovalCardState = "pending" | "approved" | "scheduled";

export interface ApprovalCardActions {
  canApprove: boolean;
  canSchedule: boolean;
  canReschedule: boolean;
  canClear: boolean;
  canUndo: boolean;
}

export function approvalCardActions(state: ApprovalCardState): ApprovalCardActions {
  return {
    canApprove: state === "pending",
    canSchedule: state === "approved",
    canReschedule: state === "scheduled",
    canClear: state === "scheduled",
    canUndo: state === "approved",
  };
}
