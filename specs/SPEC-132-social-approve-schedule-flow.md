# SPEC-132 — Social Growth: Approve → Schedule inline flow + honest copy

## Context

Social Growth's pipeline is **Generate** (Content Studio → status `in_review`) →
**Approve** (Approvals → `approved`) → **Schedule** (assign a date → `scheduled`) →
**Publish** (LATER — needs Meta/TikTok API, not built).

Two problems today:

1. **The loop is broken across tabs.** The user approves a post in the **Approvals**
   tab, then has to leave, open **Calendar**, and hunt for the post in the "Ready to
   schedule" rail to give it a date. Nothing lets them schedule where they just
   approved.
2. **The copy is misleading.**
   - Approvals shows *"Approved — ready to publish once a channel is connected."* — but
     the real next step is **Schedule**, not publish; publishing isn't built.
   - The Calendar empty-state says *"Approve posts in Content Studio…"* — approval lives
     in the **Approvals** tab, not Content Studio.
   - The Calendar "Ready to schedule" rail empty-state says *"Approve more in Content
     Studio."* — same wrong-tab error.

Governing docs: `docs/prd.md` (Social Growth is an AI organic social manager that
**routes every post through the owner** — read-only toward the store, no publishing in
this slice), `docs/Design.md` (semantic tokens only, shadcn-first, no entrance
animations — root Rule 9). Backend `schedulePost(id, date|null)` already exists
(SPEC-123); **no backend change is needed.**

## Spec Audit

Touched specs (context only, not rewritten):
- `SPEC-110-social-growth-mvp-frontend.md` — the tab set + mock discipline.
- `SPEC-123-social-growth-live.md` — live actions incl. `schedulePost`, approve,
  request-changes; the schedule endpoint's 404/409/422 contract.
- `SPEC-131-social-calendar-performance-frontend.md` — the Calendar's
  Calendar-in-Popover date-picker + optimistic schedule/rollback pattern this spec
  reuses.

This spec (SPEC-132) owns the Approvals ↔ Schedule loop and the flow/vocabulary copy.

## Goals

1. **Close the loop in Approvals.** After a post is approved, let the owner schedule it
   **inline**, without leaving the tab, using the **same** Calendar-in-Popover picker +
   optimistic `schedulePost` pattern the Calendar tab uses.
2. **Fix the misleading copy** so the vocabulary is consistent everywhere:
   Generate → Approve → Schedule → (Publish, later & clearly flagged). Never imply the
   app publishes to Instagram/TikTok today.

## Design

### 1. Shared scheduling surface (refactor, no behavior change)

Extract the Calendar tab's private `SchedulePopover` + `CopyLinkButton` into a new
`features/social/schedule-popover.tsx`, exported and driven by **primitive props**
(`productName`, `scheduledFor`, `trackedLink?`) instead of a whole `CalendarPost`, so
both the Calendar tab and the Approvals tab render the identical picker.

- `calendar-tab.tsx` imports them and drops its local copies; call sites pass the three
  primitives. Behavior is byte-for-byte the same (same picker, same
  `disabled: { before: today }`, same Unschedule/Copy actions).
- The in-popover helper line is reworded to be context-neutral (works for both the
  calendar rail and the approvals card): *"Pick a new day, or clear the date to
  unschedule."*

### 2. Approvals card state machine

`features/social/approvals-tab.tsx`'s `FeaturedCard` gains a schedule step. States and
their action bars (driven by a new pure helper — see §3):

| State       | Banner                                             | Actions                         |
| ----------- | -------------------------------------------------- | ------------------------------- |
| `pending`   | —                                                  | **Approve**, **Request changes**|
| `approved`  | ✓ *Approved — pick a date to schedule it.*         | **Schedule ▾**, **Undo**        |
| `scheduled` | ✓ *Scheduled for {formatted date}*                 | **Reschedule ▾**, **Clear**     |
| `changes`   | *Sent back for changes — regenerate…* (unchanged)  | **Undo**                        |

- **Schedule / Reschedule** open the shared `SchedulePopover`; picking a day calls
  `schedulePost(post.id, "YYYY-MM-DD")`. **Clear** (and the popover's Unschedule) call
  `schedulePost(post.id, null)` → back to `approved`.
- **Optimistic update + rollback:** flip state/date immediately; on failure restore the
  previous state+date and surface the error message (the backend's 404
  `social_post_not_found`, 409 `social_post_not_schedulable`, and 422 messages arrive
  via `services/social-actions.ts`'s `post()` and render in a `role="alert"` line).
- The scheduled/approved states carry an **honest publish note**: *"Scheduling sets the
  date and gives you a tracked link to post manually. Automatic publishing to Instagram
  or TikTok arrives once a channel is connected."* — no implication it posts now.
- Date label uses the existing `formatDate()` (date-only branch → literal calendar day,
  no timezone shift), the same helper the Calendar tab uses. No new date helper.

### 3. Pure helper (unit-tested — Rule 4)

Add to `lib/social.ts`:

```ts
export type ApprovalCardState = "pending" | "approved" | "scheduled";
export interface ApprovalCardActions { canApprove; canRequestChanges; canSchedule;
  canReschedule; canClear; canUndo }
export function approvalCardActions(state: ApprovalCardState): ApprovalCardActions
```

- `pending` → Approve + Request changes.
- `approved` → Schedule + Undo.
- `scheduled` → Reschedule + Clear.

The component uses these booleans to decide which buttons render, so the state machine
is unit-tested in the node-env Vitest suite (no component runner exists).

### 4. Copy fixes

- **Approvals approved banner:** *"Approved — ready to publish once a channel is
  connected."* → *"Approved — pick a date to schedule it."* (publish note moved to the
  honest note in §2).
- **Calendar empty-state** (`calendar-tab.tsx`): heading *"No posts scheduled yet"*;
  body teaches the real flow — *Generate in Content Studio → Approve & schedule in
  Approvals → they land here.* Two buttons: **"Open Content Studio"**
  (`/social?tab=content-studio`) and **"Go to Approvals"** (`/social?tab=approvals`).
- **Calendar rail empty-state:** *"Everything approved is scheduled. Approve more in
  Content Studio."* → *"Every approved post has a date. Approve more in the Approvals
  tab."*
- Scanned the rest of the Social surface: the Overview pipeline
  (Plan→Create→Approve→Publish→Measure) and the Performance funnel
  (generated→published) describe the conceptual loop and the backend-counted funnel —
  accurate, not a claim that the app publishes now — left unchanged. No other
  frontend-owned "publish implies posts now" copy found.

## Files

- **New** `features/social/schedule-popover.tsx` — shared `SchedulePopover` +
  `CopyLinkButton`.
- **Edit** `features/social/calendar-tab.tsx` — consume shared popover; empty-state +
  rail copy.
- **Edit** `features/social/approvals-tab.tsx` — inline approve→schedule flow + banner
  copy.
- **Edit** `lib/social.ts` — `approvalCardActions` state helper.
- **New** `tests/social-approve-schedule.test.ts` — unit tests for `approvalCardActions`
  + the scheduled-date label formatting.

## Acceptance Criteria

1. An approved post in Approvals can be scheduled inline via the shared
   Calendar-in-Popover picker — no tab switch. — **AC1**
2. Scheduling is optimistic with rollback; 404/409/422 messages surface in an alert. — **AC2**
3. A scheduled card shows "Scheduled for {date}" with Reschedule + Clear; Clear returns
   it to approved. — **AC3**
4. Approve / Request changes / Undo still work; sequence is
   pending→approved→scheduled as specified. — **AC4**
5. The Calendar tab's picker behavior is unchanged after the refactor. — **AC5**
6. Approvals banner + both Calendar empty-states use honest, correct-tab copy; no
   copy implies the app publishes to a channel today. — **AC6**
7. `approvalCardActions` is unit-tested; `npm test`, `npx tsc --noEmit`, `npm run lint`,
   `npm run build` all green. — **AC7**
8. Tokens only, no hardcoded colors, no entrance animations; keyboard-accessible in
   both themes. — **AC8**

## Manual verification checklist (no component runner — Rule 4)

- [ ] Approvals → Approve → the card shows "✓ Approved — pick a date to schedule it."
      with **Schedule** and **Undo**.
- [ ] Click **Schedule** → shadcn Calendar opens in a popover; past days disabled; pick
      a day → card flips to "✓ Scheduled for {date}" with **Reschedule** + **Clear**.
- [ ] **Reschedule** re-opens the picker with the current day preselected; picking a new
      day updates the label.
- [ ] **Clear** (and the popover's Unschedule) returns the card to the approved state.
- [ ] Forced error (offline / backend down) rolls the card back and shows an alert.
- [ ] **Undo** on an approved card returns it to pending (Approve / Request changes).
- [ ] Calendar empty-state (no posts): heading + flow copy, "Open Content Studio" →
      `?tab=content-studio`, "Go to Approvals" → `?tab=approvals`.
- [ ] Calendar rail empty-state points at the Approvals tab, not Content Studio.
- [ ] Calendar month/list scheduling still works exactly as before.
- [ ] Verified in light + dark themes; every control is keyboard-reachable and
      focus-visible.

## Patches

_None yet._
