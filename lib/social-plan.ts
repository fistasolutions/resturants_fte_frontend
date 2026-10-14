/**
 * Weekly Plan board — pure, unit-testable logic (SPEC-137). No JSX, no data
 * fetching. All date math is UTC-based so bare "YYYY-MM-DD" calendar days are
 * never zone-shifted (they represent a day, not an instant), mirroring
 * `lib/social-calendar.ts`.
 */
import type { PlanSlot, WeeklyPlan, WeeklyPlanSummary } from "@/types/social";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parse a bare "YYYY-MM-DD" day as a UTC instant at midnight, or null when the
 * string isn't a valid date-only value. */
function parseDayUTC(dateISO: string): Date | null {
  if (!dateISO || !DATE_ONLY.test(dateISO.trim())) return null;
  const [year, month, day] = dateISO.trim().split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Guard against overflow (e.g. "2026-02-31" rolling into March).
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** "2026-08-16" → "Sunday" (UTC, no zone shift). "" for an invalid date. */
export function weekdayName(dateISO: string): string {
  const date = parseDayUTC(dateISO);
  return date ? WEEKDAYS[date.getUTCDay()] : "";
}

/** "2026-08-16" → "Aug 16" (short, board-column label). "" for an invalid date. */
export function planDayLabel(dateISO: string): string {
  const date = parseDayUTC(dateISO);
  if (!date) return "";
  return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** Add `days` (may be negative) to a bare "YYYY-MM-DD" day, returning a bare
 * "YYYY-MM-DD" day. "" for an invalid input. */
export function addDaysISO(dateISO: string, days: number): string {
  const date = parseDayUTC(dateISO);
  if (!date) return "";
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export interface PlanDay {
  /** Bare calendar day "YYYY-MM-DD". */
  dateISO: string;
  /** "Sunday" … "Saturday". */
  weekday: string;
  /** "Aug 16". */
  dateLabel: string;
  slots: PlanSlot[];
}

/**
 * Lay the plan out as a chronological list of days for the board: the 7 canonical
 * days starting at `weekStart` (so the week always renders in full, even where a
 * day has no slot), plus any slot scheduled outside that window, deduped and
 * sorted ascending. Each day carries its grouped slots (in their original order).
 */
export function buildPlanBoard(plan: WeeklyPlan): PlanDay[] {
  const byDate = new Map<string, PlanSlot[]>();
  for (const slot of plan.slots) {
    const bucket = byDate.get(slot.scheduledDate);
    if (bucket) bucket.push(slot);
    else byDate.set(slot.scheduledDate, [slot]);
  }

  const dates = new Set<string>();
  for (let i = 0; i < 7; i += 1) {
    const iso = addDaysISO(plan.weekStart, i);
    if (iso) dates.add(iso);
  }
  // Never drop a slot the planner placed outside the canonical week.
  for (const date of byDate.keys()) dates.add(date);

  return [...dates]
    .sort((a, b) => a.localeCompare(b))
    .map((dateISO) => ({
      dateISO,
      weekday: weekdayName(dateISO),
      dateLabel: planDayLabel(dateISO),
      slots: byDate.get(dateISO) ?? [],
    }));
}

/** A slot has a generated draft once it carries a `postId`. */
export function slotIsGenerated(slot: PlanSlot): boolean {
  return slot.postId !== null;
}

/**
 * Ordered thumbnail-source candidates for a slot/post tile (SPEC-140 fix 1). When
 * the slot/post has a generated draft (`postId` set) the generated editorial image
 * comes first — the endpoint serves a generated image even for a product with no
 * product photo — then the product `imageUrl`. An exhausted list means the caller
 * renders the neutral placeholder tile. The URL builder is injected so the
 * "`postId` → editorial image, else product photo" decision stays pure and
 * unit-testable without env/services.
 */
export function slotThumbnailSrcs(
  postId: string | number | null | undefined,
  imageUrl: string | null | undefined,
  toPostImageUrl: (postId: string) => string,
): string[] {
  const srcs: string[] = [];
  if (postId !== null && postId !== undefined && String(postId).length > 0) {
    srcs.push(toPostImageUrl(String(postId)));
  }
  if (imageUrl) srcs.push(imageUrl);
  return srcs;
}

/** The slots still needing a draft — drives "Generate all" and its count. */
export function ungeneratedSlots(plan: WeeklyPlan): PlanSlot[] {
  return plan.slots.filter((slot) => !slotIsGenerated(slot));
}

/* ── Manually adding a slot to a plan day (SPEC-142) ──────────────────────── */

/** The two channels a manually-added plan slot can target. */
export type AddSlotChannel = "instagram" | "facebook";

/** Whether a board day has no planned slots — drives the "+ Add post" affordance. */
export function dayIsEmpty(day: PlanDay): boolean {
  return day.slots.length === 0;
}

/** The `POST /social/weekly-plans/{planId}/slots` request body (SPEC-142). */
export interface AddSlotRequest {
  productId: number;
  channel: AddSlotChannel;
  /** Bare calendar day "YYYY-MM-DD" — the board day the slot is added to. */
  scheduledDate: string;
}

/**
 * Build the add-slot POST body (SPEC-142). Coerces `productId` to a number so the
 * catalog's string `StudioProduct.id` is accepted. Pure so the request shape is
 * unit-testable without the network; reused by the `addPlanSlot` service action.
 */
export function addSlotRequestBody(
  productId: string | number,
  channel: AddSlotChannel,
  scheduledDate: string,
): AddSlotRequest {
  return { productId: Number(productId), channel, scheduledDate };
}

/**
 * Immutably add a slot to a plan (SPEC-142). A slot already present by `slotId`
 * is replaced (idempotent re-add); otherwise the new slot is appended. Never
 * mutates the input — the board re-groups it onto its `scheduledDate` day via
 * `buildPlanBoard`.
 */
export function appendSlotToPlan(plan: WeeklyPlan, slot: PlanSlot): WeeklyPlan {
  const exists = plan.slots.some((s) => s.slotId === slot.slotId);
  return {
    ...plan,
    slots: exists
      ? plan.slots.map((s) => (s.slotId === slot.slotId ? slot : s))
      : [...plan.slots, slot],
  };
}

/** Immutably replace a slot (matched by `slotId`) with the server's updated copy
 * after a per-slot generate. Never mutates the input. */
export function mergeSlotIntoPlan(plan: WeeklyPlan, updated: PlanSlot): WeeklyPlan {
  return {
    ...plan,
    slots: plan.slots.map((slot) =>
      slot.slotId === updated.slotId ? updated : slot,
    ),
  };
}

/* ── "Generate all" progress reducer ──────────────────────────────────────
 * Sequential generation of every ungenerated slot, resilient to one failing
 * (continue + report). A tiny pure reducer so the component stays declarative
 * and the progress math is unit-testable in the node-env Vitest suite. */

export interface GenAllProgress {
  /** How many slots this run set out to generate. */
  total: number;
  succeeded: number;
  failed: number;
  /** True while the run is in flight. */
  running: boolean;
}

/** Start a run over `total` slots. A zero-length run starts already finished. */
export function initGenAll(total: number): GenAllProgress {
  const safe = Math.max(0, Math.floor(total));
  return { total: safe, succeeded: 0, failed: 0, running: safe > 0 };
}

/** Record one slot's outcome (does not flip `running` off — call `finishGenAll`
 * after the last slot). Never mutates the input. */
export function recordGenAll(state: GenAllProgress, ok: boolean): GenAllProgress {
  return {
    ...state,
    succeeded: state.succeeded + (ok ? 1 : 0),
    failed: state.failed + (ok ? 0 : 1),
  };
}

/** Mark the run complete. */
export function finishGenAll(state: GenAllProgress): GenAllProgress {
  return { ...state, running: false };
}

/** Slots processed so far (succeeded + failed). */
export function genAllDone(state: GenAllProgress): number {
  return state.succeeded + state.failed;
}

/** Human-readable progress: "Generating 2 of 5…" while running, else a summary
 * ("Generated all 5 drafts." / "Generated 4 of 5 — 1 failed. Try those again."). */
export function genAllProgressLabel(state: GenAllProgress): string {
  const done = genAllDone(state);
  if (state.running) {
    const current = Math.min(done + 1, state.total);
    return `Generating ${current} of ${state.total}…`;
  }
  if (state.total === 0) {
    return "Every slot already has a draft.";
  }
  if (state.failed === 0) {
    return `Generated all ${state.total} drafts.`;
  }
  return `Generated ${state.succeeded} of ${state.total} — ${state.failed} failed. Try those again.`;
}

/* ── Weekly Plan history + breadcrumbs (SPEC-138) ─────────────────────────── */

/**
 * Order plan-history rows newest first by `createdAt`. The backend already sends
 * them newest-first, but sorting defensively here keeps the list stable when a
 * freshly generated plan is merged in client-side. Ties fall back to descending
 * `id` (higher id = newer). Never mutates the input.
 */
export function sortPlanSummaries(
  plans: readonly WeeklyPlanSummary[],
): WeeklyPlanSummary[] {
  return [...plans].sort((a, b) => {
    const at = Date.parse(a.createdAt);
    const bt = Date.parse(b.createdAt);
    const aValid = !Number.isNaN(at);
    const bValid = !Number.isNaN(bt);
    if (aValid && bValid && at !== bt) return bt - at;
    // Unparseable dates sink below valid ones; otherwise break ties by id.
    if (aValid !== bValid) return aValid ? -1 : 1;
    return b.id - a.id;
  });
}

/**
 * The active plan's id — the currently-live plan the owner is working (SPEC-140
 * fix 6). "Active" is the newest plan by `createdAt` (the current week's), reusing
 * `sortPlanSummaries` so "newest = active" has one definition. `null` for an empty
 * history. Drives the green "Active" pill in the plans list.
 */


/** A breadcrumb crumb. `target` names where clicking it navigates (`null` = the
 * current, non-clickable crumb). */
export type CrumbTarget = "root" | "history" | "board";

export interface PlanCrumb {
  label: string;
  target: CrumbTarget | null;
}

/**
 * Build the Weekly Plans breadcrumb trail (Social Growth › Weekly Plans › {plan}
 * › {post}). The deepest crumb is always the current (non-clickable) one:
 * - history:  Social Growth › **Weekly Plans**
 * - board:    Social Growth › Weekly Plans › **{planTitle}**
 * - detail:   Social Growth › Weekly Plans › {planTitle} › **{postName}**
 */
export function buildWeeklyPlanCrumbs(opts: {
  planTitle: string | null;
  postName: string | null;
}): PlanCrumb[] {
  const { planTitle, postName } = opts;
  const crumbs: PlanCrumb[] = [{ label: "Social Media Manager", target: "root" }];
  crumbs.push({
    label: "Weekly Plans",
    target: planTitle ? "history" : null,
  });
  if (planTitle) {
    crumbs.push({ label: planTitle, target: postName ? "board" : null });
  }
  if (postName) {
    crumbs.push({ label: postName, target: null });
  }
  return crumbs;
}
