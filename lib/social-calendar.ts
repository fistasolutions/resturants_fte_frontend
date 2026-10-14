/**
 * Social Growth — Calendar bucketing & month-grid layout (SPEC-131). Pure and
 * unit-testable: no JSX, no data fetching. All date math is UTC-based so the
 * grid is identical regardless of the viewer's machine timezone (calendar dates
 * are bare "YYYY-MM-DD" days, not instants — they must NOT be zone-shifted).
 */
import type { CalendarPost } from "@/types/social";

/** Posts still awaiting a date — the "ready to schedule" rail. */
export function readyToSchedule(posts: CalendarPost[]): CalendarPost[] {
  return posts.filter((p) => p.scheduledFor === null);
}

/** Posts already assigned to a day — placed on the grid. */
export function scheduledPosts(posts: CalendarPost[]): CalendarPost[] {
  return posts.filter((p) => p.scheduledFor !== null);
}

/** Group scheduled posts by their "YYYY-MM-DD" date. Undated posts are skipped. */
export function groupPostsByDate(posts: CalendarPost[]): Map<string, CalendarPost[]> {
  const byDate = new Map<string, CalendarPost[]>();
  for (const post of posts) {
    if (post.scheduledFor === null) continue;
    const bucket = byDate.get(post.scheduledFor);
    if (bucket) bucket.push(post);
    else byDate.set(post.scheduledFor, [post]);
  }
  return byDate;
}

export interface CalendarCell {
  /** Bare calendar day "YYYY-MM-DD". */
  dateISO: string;
  /** Day-of-month number (1–31). */
  day: number;
  /** True when the cell belongs to the anchor month (vs a leading/trailing spill day). */
  inCurrentMonth: boolean;
  isToday: boolean;
  posts: CalendarPost[];
}

function isoFromUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A Sunday-first month grid for `year`/`month` (month is 0-based, like `Date`),
 * as an array of weeks, each a 7-cell row. Leading/trailing days from the
 * adjacent months fill the first/last week (`inCurrentMonth: false`). Each cell
 * carries the scheduled posts for its day from `byDate`.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  byDate: Map<string, CalendarPost[]>,
  todayISO: string,
): CalendarCell[][] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startWeekday = firstOfMonth.getUTCDay(); // 0 = Sunday
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const gridStart = new Date(Date.UTC(year, month, 1 - startWeekday));
  const weeks: CalendarCell[][] = [];

  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    const dateISO = isoFromUTC(d);
    const cell: CalendarCell = {
      dateISO,
      day: d.getUTCDate(),
      inCurrentMonth: d.getUTCMonth() === month,
      isToday: dateISO === todayISO,
      posts: byDate.get(dateISO) ?? [],
    };
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(cell);
  }
  return weeks;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "August 2026" for the given 0-based month. */
export function monthTitle(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

/** The month to open the calendar on: the month of the earliest scheduled post,
 * else the current month (from `todayISO`). Keeps the first thing the user sees
 * relevant when everything is scheduled in a different month. */
export function initialMonth(
  posts: CalendarPost[],
  todayISO: string,
): { year: number; month: number } {
  const dated = scheduledPosts(posts)
    .map((p) => p.scheduledFor as string)
    .sort();
  const anchor = dated[0] ?? todayISO;
  const [year, month] = anchor.split("-").map(Number);
  return { year, month: month - 1 };
}

export interface ScheduledDay {
  dateISO: string;
  posts: CalendarPost[];
}

/** Scheduled posts as a flat, date-ascending list of days — the List view. */
export function scheduledByDateSorted(posts: CalendarPost[]): ScheduledDay[] {
  const byDate = groupPostsByDate(posts);
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateISO, dayPosts]) => ({ dateISO, posts: dayPosts }));
}

/* ── Date rules & drop eligibility (SPEC-143) ─────────────────────────────
 * Calendar days are bare "YYYY-MM-DD" strings, so lexicographic comparison is
 * exact date ordering — no Date parsing (and no timezone shift) required. */

/** A day strictly before today — visually muted, non-interactive, no drop. */
export function isPastDay(dateISO: string, todayISO: string): boolean {
  return dateISO < todayISO;
}

/** Whether a day can accept scheduling: today or any future day (never the
 * past). Drives both the drag drop-targets and the empty-day Add popover. */
export function isDropEligible(dateISO: string, todayISO: string): boolean {
  return !isPastDay(dateISO, todayISO);
}

/** The Sunday (week start) of the week containing `anchorISO`. */
export function weekStartISO(anchorISO: string): string {
  const [y, m, d] = anchorISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return isoFromUTC(date);
}

/** Shift a bare calendar day by `days` (may be negative) — UTC day arithmetic. */
export function shiftDateISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return isoFromUTC(date);
}

/**
 * The 7 Sunday-first cells for the week containing `anchorISO`, each carrying its
 * bucketed posts. `inCurrentMonth` reflects whether the day shares the anchor's
 * month (styling hint only — the Week view mutes by past-day, not by month).
 */
export function buildWeekGrid(
  anchorISO: string,
  byDate: Map<string, CalendarPost[]>,
  todayISO: string,
): CalendarCell[] {
  const start = weekStartISO(anchorISO);
  const anchorMonth = Number(anchorISO.split("-")[1]);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 7; i++) {
    const dateISO = shiftDateISO(start, i);
    cells.push({
      dateISO,
      day: Number(dateISO.split("-")[2]),
      inCurrentMonth: Number(dateISO.split("-")[1]) === anchorMonth,
      isToday: dateISO === todayISO,
      posts: byDate.get(dateISO) ?? [],
    });
  }
  return cells;
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Aug 16 – 22, 2026" for a week starting on `weekStartISO`; spells both months
 * when the week straddles a boundary ("Aug 30 – Sep 5, 2026"), and both years at
 * a December→January turn ("Dec 27, 2026 – Jan 2, 2027"). */
export function weekRangeLabel(weekStart: string): string {
  const end = shiftDateISO(weekStart, 6);
  const [sy, sm, sd] = weekStart.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startLabel = `${MONTH_ABBR[sm - 1]} ${sd}`;
  if (sy !== ey) {
    return `${startLabel}, ${sy} – ${MONTH_ABBR[em - 1]} ${ed}, ${ey}`;
  }
  if (sm !== em) {
    return `${startLabel} – ${MONTH_ABBR[em - 1]} ${ed}, ${ey}`;
  }
  return `${startLabel} – ${ed}, ${ey}`;
}

/* ── Client-model transitions (SPEC-143) ──────────────────────────────────
 * Pure updates to the in-memory post list — the source of truth for optimistic
 * schedule/reschedule/unschedule/delete and their rollback. */

/** A post re-dated to `date` (or unscheduled when null); flips `status` to match
 * the two calendar states (`scheduled` / `approved`). */
export function rescheduledPost(post: CalendarPost, date: string | null): CalendarPost {
  return { ...post, scheduledFor: date, status: date ? "scheduled" : "approved" };
}

/** Replace one post by id (identity-preserving for the rest of the list). */
export function replacePost(
  posts: CalendarPost[],
  id: string,
  next: CalendarPost,
): CalendarPost[] {
  return posts.map((p) => (p.id === id ? next : p));
}

/** Remove one post by id — the Delete transition. */
export function removePost(posts: CalendarPost[], id: string): CalendarPost[] {
  return posts.filter((p) => p.id !== id);
}

/** The exact `POST /social/posts/{id}/schedule` body (SPEC-143) — one place that
 * owns the request shape so it's asserted in a unit test. */
export function scheduleRequestBody(date: string | null): { date: string | null } {
  return { date };
}
