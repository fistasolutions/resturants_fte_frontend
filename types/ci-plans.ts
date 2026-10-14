/** CI Plans (SPEC-272) — the view models of backend SPEC-271's `/ci/plans*`. */

export type PlanStatus = "awaiting" | "accepted" | "rejected";

export interface CiPlan {
  id: number;
  title: string;
  /** "In one line". */
  memo: string;
  /** "Why now". */
  why: string;
  /** "What you get" — bullets. */
  gets: string[];
  effortDays: number | null;
  whereItLives: string;
  value: string;
  status: PlanStatus;
  createdByName: string | null;
  decidedByName: string | null;
  /** ISO instant, set once the CEO decided. */
  decidedAt: string | null;
  rejectReason: string | null;
  rejectInstead: string | null;
  /** The owner's optional note on a Yes (backend SPEC-276). */
  acceptNote: string | null;
  hasImage: boolean;
  /** ISO instant. */
  createdAt: string;
}

export interface PlanCounts {
  awaiting: number;
  accepted: number;
  rejected: number;
}

export interface CiPlanList {
  plans: CiPlan[];
  counts: PlanCounts;
  /** Sum of `effortDays` over the plans still awaiting a decision. */
  effortAwaitingDays: number;
}

/** What the team types into the New / Edit plan dialog. */
export interface PlanDraft {
  title: string;
  memo: string;
  why: string;
  /** One bullet per line, as typed. */
  gets: string;
  whereItLives: string;
  value: string;
  /** As typed — "4", "2.5" or "". */
  effortDays: string;
}
