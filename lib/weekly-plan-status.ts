/**
 * Weekly plan status — SPEC-174 (backend SPEC-185).
 *
 * **Derived, never stored.** The bug this replaces was not a missing status value:
 * it was that status lived in a column nothing updated. A plan entered `active`
 * and stayed there forever, so on 2026-08-28 two plans covering the week of
 * 2026-08-23 both reported Active — five days in, nine of eleven posts never
 * drafted, none posted. Adding `completed` to that column would have reproduced
 * the same bug one release later.
 *
 * Everything below is a pure function of facts already true in the database plus
 * the viewer's today, so it cannot go stale and needs no job.
 *
 * Today is the VIEWER's, deliberately. A week that ended an hour ago in New York
 * should read as ended to a New York owner; deriving it server-side would bake
 * UTC into a judgment about someone else's week.
 */

export type PlanStatus =
  | "superseded"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "partly_done"
  | "missed";

export interface PlanFacts {
  /** Bare "YYYY-MM-DD" — the Sunday the plan covers. */
  weekStart: string;
  slotCount: number;
  postedCount: number;
  /** Slots with a draft generated. Drafted-but-not-posted is its own state worth
   * surfacing: 3 ready to post is a very different week from 0 drafted. */
  generatedCount: number;
  /** The id of a newer plan covering the same week, when one exists. */
  supersededBy: number | null;
}

/** Local calendar day as "YYYY-MM-DD". Not `toISOString()` — that converts to UTC
 * and would call it tomorrow from 8pm Eastern onward. */
export function todayISO(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The Saturday a plan's week ends on. String arithmetic via Date, then re-emitted
 * as a bare day so every comparison in this module stays string-to-string. */
export function weekEnd(weekStart: string): string {
  const [year, month, day] = weekStart.split("-").map(Number);
  const end = new Date(year, month - 1, day + 6);
  return todayISO(end);
}

export function planStatus(facts: PlanFacts, today: string): PlanStatus {
  // Checked first: a superseded plan's own progress is irrelevant — it is not the
  // plan that governs the week.
  if (facts.supersededBy !== null) return "superseded";
  if (today < facts.weekStart) return "upcoming";
  if (today <= weekEnd(facts.weekStart)) return "in_progress";
  // The week is over — now the counts decide.
  if (facts.slotCount > 0 && facts.postedCount >= facts.slotCount) return "completed";
  if (facts.postedCount > 0) return "partly_done";
  return "missed";
}

export type StatusTone = "success" | "warning" | "critical" | "neutral" | "info";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const STATUS_META: Record<PlanStatus, StatusMeta> = {
  superseded: { label: "Superseded", tone: "neutral" },
  upcoming: { label: "Upcoming", tone: "info" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  partly_done: { label: "Partly done", tone: "warning" },
  missed: { label: "Missed", tone: "critical" },
};

export function statusMeta(status: PlanStatus): StatusMeta {
  return STATUS_META[status];
}

/**
 * The one honest line under a plan. Says what happened, not what was generated —
 * "1 / 5 drafts" made a week with nothing published look underway.
 */
export function planSummary(facts: PlanFacts, today: string): string {
  const status = planStatus(facts, today);
  if (status === "superseded") return "Replaced by a newer plan for this week.";
  if (status === "upcoming") return `${facts.slotCount} posts planned · week hasn't started.`;

  const missed = Math.max(0, facts.slotCount - facts.postedCount);
  const posted = `${facts.postedCount} of ${facts.slotCount} posted`;
  // Drafts already written but not yet posted — work that is done and only needs
  // publishing. Worth saying while the week can still be saved.
  const waiting = Math.max(0, facts.generatedCount - facts.postedCount);
  if (status === "in_progress") {
    const ready = waiting > 0 ? ` · ${waiting} ready to post` : "";
    return `${posted}${ready} · week ends ${weekEnd(facts.weekStart)}.`;
  }
  if (status === "completed") return `${posted} · week complete.`;
  return `${posted} · ${missed} missed.`;
}

/** 0–100. Zero slots is 0%, never a division by nothing. */
export function planProgress(facts: PlanFacts): number {
  if (facts.slotCount <= 0) return 0;
  return Math.round((facts.postedCount / facts.slotCount) * 100);
}

/* ── The day board ───────────────────────────────────────────────────────── */

export type SlotState = "posted" | "missed" | "drafted" | "planned" | "empty";

/**
 * What a single day on the board actually is. The board currently renders a day
 * five days past with nothing posted identically to a day next week — so the days
 * that still need action look the same as the ones that can no longer be saved.
 */
export function slotState(
  slot: { scheduledDate: string; postId: number | null; postStatus: string | null },
  today: string,
): SlotState {
  if (slot.postStatus === "published") return "posted";
  const past = slot.scheduledDate < today;
  if (past) return "missed";
  if (slot.postId !== null) return "drafted";
  return "planned";
}
