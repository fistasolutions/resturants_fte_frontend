# SPEC-143 — Social Growth: professional content calendar (full CRUD + drag-and-drop)

- **Repo:** `ecommerce-fte-frontend`
- **Status:** implemented
- **Depends on / extends:** SPEC-110 (Social MVP), SPEC-123 (live calendar +
  `schedulePost`), SPEC-131 (month grid / bucketing helpers), SPEC-132 (schedule
  popover), SPEC-138 (`PostDetail`, `PostCard`, `EditorialThumb`, status chips),
  SPEC-140 (`EditorialThumb`), SPEC-142 (calendar layout).
- **Governing docs:** `../docs/prd.md` (Social Growth, V1 scope — organic social
  content workflow), `../docs/Design.md` (tokens, spacing, motion — Rule 9),
  root Rules 3/4/6/7/9/10.

## Problem

The Calendar tab (SPEC-131) is a month/list view with a "Ready to schedule" rail
where rescheduling is only reachable through a popover date picker. It is
functional but not a first-class content calendar: no Week view, no live counts,
no click-through to the post, no drag-and-drop, no way to delete a post, and
scheduled posts render as plain product-thumb chips instead of the editorial
thumbnail the rest of Social uses. This spec turns it into a Buffer/Later-grade
content calendar, built entirely on the reusable pieces we already ship
(`PostDetail`, `PostCard`, `EditorialThumb`, `SchedulePopover`, the month-grid
helpers).

## Scope

Frontend only. Consumes the existing live contract plus **one new endpoint** the
backend already exposes:

| Method | Path | Body | Result | Notes |
| --- | --- | --- | --- | --- |
| GET | `/social/calendar` | — | `{ posts: CalendarPost[] }` | existing (SPEC-123) |
| POST | `/social/posts/{id}/schedule` | `{ date: "YYYY-MM-DD" \| null }` | `CalendarPost` | existing — reschedule (date) / unschedule (null) |
| GET | `/social/posts/{id}` | — | `PostDetail` | existing — backs `PostDetail` |
| **DELETE** | **`/social/posts/{id}`** | — | **`{ ok: true }`** | **NEW** — 404 on foreign/missing; typed client action `deletePost(id)` |

Everything remains **read-only toward Shopify** and metric-free (Rule 8): the
calendar only moves the store's own generated/approved posts between dates.

## What changes

### 1. New client action — `deletePost(id)` (`services/social-actions.ts`)

```ts
/** Permanently delete a social post (`DELETE /social/posts/{id}`). Returns
 *  `{ ok: true }`; the backend's 404 `social_post_not_found` surfaces via the
 *  shared error envelope. */
export function deletePost(id: string): Promise<{ ok: boolean }>;
```

Added alongside `schedulePost` — same proxy/error-envelope seam, no server-only
imports (safe in the client bundle).

### 2. New pure calendar logic (`lib/social-calendar.ts`) — unit-tested

All additions are pure, UTC-based, no JSX/no fetch (same discipline as SPEC-131):

- `isPastDay(dateISO, todayISO): boolean` — a bare calendar day strictly before
  today. Lexicographic compare of `YYYY-MM-DD` is correct.
- `isDropEligible(dateISO, todayISO): boolean` — `!isPastDay` (today + future
  accept scheduling; the past rejects drops).
- `weekStartISO(anchorISO): string` — the Sunday of the week containing `anchor`.
- `shiftDateISO(dateISO, days): string` — UTC day arithmetic (week nav).
- `buildWeekGrid(anchorISO, byDate, todayISO): CalendarCell[]` — the 7 Sunday-first
  cells for `anchor`'s week, each carrying its bucketed posts (reuses `CalendarCell`).
- `weekRangeLabel(weekStartISO): string` — e.g. `"Aug 16 – 22, 2026"` /
  `"Aug 30 – Sep 5, 2026"` (spans month/year boundaries).
- Client-model transitions (drive optimistic updates + rollback):
  - `rescheduledPost(post, date): CalendarPost` — flips `scheduledFor` +
    `status` (`date ? "scheduled" : "approved"`).
  - `replacePost(posts, id, next): CalendarPost[]`.
  - `removePost(posts, id): CalendarPost[]`.
- Request builder: `scheduleRequestBody(date): { date: string | null }` — the
  exact POST body, so the shape is asserted in a unit test.

### 3. Calendar tab rebuild (`features/social/calendar-tab.tsx`)

- **Three views**, segmented control: **Month** (default) · **Week** (new) · **List**.
  - Month: existing grid, upgraded cells (below). `‹ ›` month nav + **Today**.
  - Week: single Sunday-first 7-column row (scrolls horizontally on mobile),
    `‹ ›` week nav (± 7 days) + **Today**, `weekRangeLabel` title.
  - List: date-ascending scheduled days (existing), each row now click-to-open +
    action menu.
- **Live counts** header: `"{N} scheduled · {M} ready"`.
- **Scheduled chip** (`CalendarChip`): `EditorialThumb` (generated image via
  `postImageUrl`, falls back to product photo then placeholder), a `ChannelBadge`
  icon, the product/campaign title, and a **status color dot** (success = scheduled).
  - **Click the chip → opens `PostDetail`** in a `Dialog` (read / edit caption /
    approve / regenerate image — the reusable view, unchanged). `onChanged`
    refreshes the server data.
  - **Chip actions menu** (`DropdownMenu`, keyboard-operable): **Reschedule**
    (opens the `SchedulePopover` date picker → past dates blocked), **Unschedule**
    (`schedulePost(id, null)` → returns to Ready rail), **Delete** (opens a small
    `AlertDialog` confirm → `deletePost(id)`).
- **Drag-and-drop (native HTML5 — user interaction, not an entrance animation,
  Rule 9 compliant):**
  - Drag a **scheduled chip** onto another day → `schedulePost(id, newDate)`
    (reschedule), optimistic via `rescheduledPost` + rollback on error.
  - Drag a **Ready rail** post onto a day → `schedulePost(id, date)` (schedule).
  - **Past days are not drop targets** (`onDragOver` only `preventDefault`s on
    eligible days); eligible days show a dashed `ring-primary` affordance while a
    drag hovers.
  - **Keyboard/click fallback for every drag action:** each chip's Reschedule
    date-picker moves it without a mouse; the Ready rail's Schedule picker places
    it; the empty-day Add popover schedules by keyboard. The calendar is fully
    usable with no pointer.
- **Click an upcoming empty day → Add popover:** lists the **Ready-to-schedule**
  posts; picking one calls `schedulePost(id, thatDay)`. Includes a subtle
  "Create new in Content Studio" link (`/social?tab=content-studio`). Past/empty
  days are inert (no popover).
- **Date rules:** past days are visually muted (`opacity`, `bg-muted/30`) and
  non-interactive — no Add, no drop target, and the reschedule picker already
  blocks past dates (`disabled={{ before: today }}`, SchedulePopover). Today is
  ring-highlighted. Only today/future accept scheduling.
- **States:** skeleton grid while the tab's `Suspense` streams (page already does
  this) + an in-component empty state ("nothing scheduled yet — approve posts to
  schedule them") and a dismissible error banner (existing pattern, kept for
  optimistic-op failures). Ready rail keeps its own empty state.
- **Tokens only, both themes, responsive:** Week/List degrade cleanly on mobile
  (horizontal scroll for the week row; the month grid keeps its existing
  `min-w` scroll container). Keyboard + ARIA throughout (draggable chips also
  expose their menu via keyboard; `aria-grabbed` on drag).

## Non-goals

- No new generate/create flow here — the Add popover only links out to Content
  Studio (Rule: Social's generate lives in Content Studio).
- No backend work (the DELETE endpoint already exists per the task contract).
- No Shopify mutation, no metric calculation (Rules 8).

## Files touched

- `services/social-actions.ts` — add `deletePost`.
- `lib/social-calendar.ts` — add the pure helpers above.
- `features/social/calendar-tab.tsx` — rebuilt views + CRUD + DnD.
- `tests/social-calendar.test.ts` — extend with the new pure-logic cases.
- `../docs/MEMORY.md` — Rule 10 daily entry.

## Acceptance criteria

1. `deletePost(id)` exists, typed, goes through the proxy seam, surfaces the
   error envelope. — **done**
2. Month / Week / List views all render; Month default; view switch keyboard-operable. — **done**
3. Week view: Sunday-first 7 days, `‹ ›` ±7-day nav, Today, `weekRangeLabel` title. — **done**
4. Live counts header shows scheduled + ready counts. — **done**
5. Scheduled chips use `EditorialThumb` + channel icon + title + status dot. — **done**
6. Click a chip opens `PostDetail` (edit/approve/regenerate) in a dialog. — **done**
7. Chip menu: Reschedule (picker), Unschedule (→ ready), Delete (confirm). — **done**
8. Drag scheduled chip → new day reschedules (optimistic + rollback). — **done**
9. Drag Ready post → day schedules it. — **done**
10. Past days reject drops + are muted/non-interactive; eligible days show a drop affordance. — **done**
11. Click an upcoming empty day → Add popover of Ready posts + Content Studio link. — **done**
12. Every drag action has a keyboard/click fallback. — **done**
13. Pure logic (`buildWeekGrid`, `isPastDay`, `isDropEligible`, `weekStartISO`,
    `shiftDateISO`, `weekRangeLabel`, `rescheduledPost`, `replacePost`,
    `removePost`, `scheduleRequestBody`) unit-tested green. — **done**
14. Tokens only (no hardcoded colors), no entrance animation, both themes,
    responsive. — **done**
15. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green. — **done**

## Manual verification checklist

- [ ] Drag a scheduled chip from one day to another → it moves; error rolls back.
- [ ] Drag a Ready-rail post onto a future day → it schedules and leaves the rail.
- [ ] Click a chip → `PostDetail` opens; edit caption / regenerate image / approve works; closing refreshes.
- [ ] Click an upcoming empty day → Add popover lists Ready posts; pick one → it schedules onto that day.
- [ ] A past day: muted, no Add popover, rejects a drop (no highlight, drop no-ops).
- [ ] Chip menu → Unschedule → chip returns to Ready rail.
- [ ] Chip menu → Delete → confirm dialog → post disappears from calendar and rail.
- [ ] Switch Month / Week / List → all render; Week nav ±7 days; Today returns to current week/month.
- [ ] Light + dark theme: chips, dots, drop affordance, muted past days all legible.
- [ ] Full keyboard: Tab to a chip, open its menu, Reschedule via picker; Tab to Ready row, Schedule via picker; no mouse needed.

## Patches

_(none yet)_
