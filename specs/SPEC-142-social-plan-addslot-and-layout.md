# SPEC-142 — Social Growth: full-width approval detail, restored plan entry point, "+ Add post" on empty days

**Status:** implemented
**Repo:** `ecommerce-fte-frontend`
**Depends on / touches:** SPEC-110, SPEC-123, SPEC-133, SPEC-134, SPEC-135,
SPEC-137, SPEC-138, SPEC-140 (Content Studio, Weekly Plan board + panel,
`PostDetail`, Approvals, `services/social-actions.ts`, `lib/social-plan.ts`,
`types/social.ts`).
**Author:** musman@greenshades.com — 2026-08-18

## Context

Three follow-up issues on the Social Growth surface after the weekly-plan +
polish work (SPEC-137/138/140):

1. Opening a post from **Approvals** renders `PostDetail` inside the narrow
   featured column (`max-w-lg`), squeezing its own two-column layout into ~half
   the width — hashtags wrap character-by-character and the right panel is cramped.
2. SPEC-140 removed the "Generate Weekly Plan" button from the main Content Studio
   header, leaving only "Plan history". A user browsing products has no direct way
   to kick off a weekly plan.
3. The AI planner can leave a day with **"No post planned"**. There is no way to
   add a post to an empty day manually.

All three are presentation/interaction changes plus one additive backend call
(`POST /social/weekly-plans/{planId}/slots`). No metric calculation in the UI
(Rule 8); reuse existing components; tokens only, both themes (Rule 9).

## Goal

### Fix 1 — Approvals post-detail is full width

`approvals-tab.tsx`: when a detail is open, render `PostDetail` across the full
content width (drop the narrow `max-w-lg` featured wrapper). `PostDetail`'s own
`lg:grid-cols-[24rem_minmax(0,1fr)]` layout then has room; hashtags and the
right-hand details panel are no longer cramped. Both themes, responsive (still
stacks to one column below `lg`).

### Fix 2 — "Generate Weekly Plan" restored on the main Content Studio header

`content-studio-tab.tsx`: add a primary **"Generate Weekly Plan"** button to the
main tab header, next to the outline **"Plan history"** toggle. Clicking it opens
the Weekly Plans area and immediately runs the planner (via an incrementing
`generateNonce` passed to `WeeklyPlansPanel`, watched by an effect that calls the
panel's existing `runGenerate`).

To keep **exactly one** "Generate Weekly Plan" button (the main header) with no
duplicates on any single screen, `weekly-plans-panel.tsx` **removes** its
history-view header Generate button and its empty-state Generate button. The
plan-board detail view keeps its own **"Generate all"** and **"New plan"**
controls (different labels, the board's own controls — not duplicates).

### Fix 3 — "+ Add post" on empty plan days

`weekly-plan-board.tsx`: an empty day cell ("No post planned") renders a clear
**"+ Add post"** button. Clicking it opens a compact picker dialog (reusing the
product-search fetch + `ProductThumb`) to search/select a product and choose
Instagram or Facebook, then calls the new backend endpoint to add a slot for that
day. After adding, the new (ungenerated) slot appears in that day's cell with the
normal per-slot **Generate** button; generating it later auto-schedules to that
day on approve, exactly as today.

- New endpoint: `POST /social/weekly-plans/{planId}/slots`, body
  `{ productId:int, channel:"instagram"|"facebook", scheduledDate:"YYYY-MM-DD" }`
  → returns the new `Slot` (`{ slotId, productId, productName, imageUrl, channel,
  scheduledDate, occasion, campaignName, reason, reasonDetail, rationale,
  postId:null, postStatus:null }`, i.e. the existing `PlanSlot` shape).
- New typed client action `addPlanSlot(planId, productId, channel, scheduledDate)`
  in `services/social-actions.ts`.
- Loading / empty / error states; `scheduledDate` is that day's date from the
  board. The "+ Add post" is a real `<button>`; the picker is a keyboard-navigable
  shadcn `Dialog`.

## Non-goals / constraints

- Semantic tokens only; no hardcoded colors; brand red never for status/CTA
  (Rule 9). No framer-motion / no entrance animations (Rule 9); allowed motion is
  CSS hover/focus + shadcn dialog transition + skeleton pulse.
- No metric calculation in the UI (Rule 8). The added slot's identity/rationale
  come from the backend.
- Reuse existing components (`Dialog`, `Input`, `ProductThumb`, `Button`,
  `Skeleton`, `fetchSocialProducts`) before writing new ones.

## Design / implementation

### Pure logic (`lib/social-plan.ts`) — unit-tested

- `type AddSlotChannel = "instagram" | "facebook"`.
- `dayIsEmpty(day: PlanDay): boolean` → `day.slots.length === 0` (drives the
  "+ Add post" affordance).
- `addSlotRequestBody(productId, channel, scheduledDate): AddSlotRequest` → the
  `POST` body `{ productId:number, channel, scheduledDate }`, coercing a string
  `productId` (the catalog's `StudioProduct.id`) to a number. Pure so the request
  shape is testable without the network; reused by the service action.
- `appendSlotToPlan(plan, slot): WeeklyPlan` → immutably add a slot; a slot
  already present by `slotId` is replaced (idempotent re-add), otherwise appended.
  Never mutates the input; the board re-groups it onto its `scheduledDate` day via
  the existing `buildPlanBoard`.

### Service (`services/social-actions.ts`)

- `addPlanSlot(planId, productId, channel, scheduledDate): Promise<PlanSlot>` →
  `POST /social/weekly-plans/{planId}/slots` with `addSlotRequestBody(...)`.
  Rejects (shared error envelope) on failure so the dialog can show the message.

### Components

- **`features/social/add-slot-dialog.tsx` (new, client).** A compact shadcn
  `Dialog`: a 2-option Instagram/Facebook segmented control (radiogroup, neutral
  glyphs — Rule 9), a debounced full-catalog product search
  (`fetchSocialProducts("all", …)`), a scrollable selectable product list
  (`ProductThumb` + name + category·price, `aria-pressed` selection), and an
  "Add post" action. Owns its own loading/empty/error + "adding" states; the
  parent's `onAdd` performs the API call + merge and closes the dialog on success.
- **`weekly-plan-board.tsx`.** Empty day cell → a dashed **"+ Add post"** button
  that opens `AddSlotDialog` for `day.dateISO`. `handleAddSlot` calls `addPlanSlot`,
  merges via `appendSlotToPlan`, reports up via `onPlanMutated`, and closes the
  dialog. The new slot renders as a normal ungenerated `SlotCard` with Generate.
- **`content-studio-tab.tsx`.** Add the primary "Generate Weekly Plan" button to
  the main header; an incrementing `planGenerateNonce` is passed to
  `WeeklyPlansPanel` and opens plan mode.
- **`weekly-plans-panel.tsx`.** Accept an optional `generateNonce`; an effect runs
  `runGenerate` when it increments. Remove the history-view header Generate button
  and the empty-state Generate button (single entry point now lives on the tab
  header).
- **`approvals-tab.tsx`.** Detail wrapper `max-w-lg` → full width.

## Acceptance criteria

1. Opening a post from Approvals renders `PostDetail` at full content width; its
   two columns (preview + details/hashtags) have room; hashtags/the right panel
   are not cramped; still stacks below `lg`; both themes. — **done**
2. The main Content Studio header shows both "Plan history" and "Generate Weekly
   Plan"; clicking the latter opens the plans area and builds a plan. Exactly one
   "Generate Weekly Plan" button is visible on any single screen (the board keeps
   its own "Generate all"/"New plan"). — **done**
3. An empty plan day shows a "+ Add post" button; clicking opens a keyboard-
   navigable picker (search/select a product + choose IG/FB); adding calls
   `POST /social/weekly-plans/{planId}/slots`, the new slot appears in that day
   with the normal Generate button; loading/empty/error states handled; both
   themes. — **done**
4. `addSlotRequestBody`, `dayIsEmpty`, `appendSlotToPlan` are pure and unit-tested;
   `addPlanSlot` is a typed client action reusing `addSlotRequestBody`. — **done**

## Tests

`tests/social-plan.test.ts` adds coverage for `dayIsEmpty` (empty vs populated
day), `addSlotRequestBody` (string→number coercion, channel/date pass-through),
and `appendSlotToPlan` (append new, replace by slotId, no mutation). `npm test`,
`npx tsc --noEmit`, `npm run lint`, `npm run build` all green.

## Manual verification checklist

- [ ] Approvals: open a post — the detail fills the width in two columns; hashtags
      wrap normally (not char-by-char); the right panel is not cramped; stacks on
      mobile; both themes.
- [ ] Content Studio: main header shows "Plan history" + "Generate Weekly Plan";
      clicking Generate builds a plan; no duplicate "Generate Weekly Plan" button
      on any screen (history list, empty state, board); the board still has
      "Generate all"/"New plan".
- [ ] Weekly Plan board: an empty day shows "+ Add post"; clicking opens the
      picker; search + select a product, choose IG/FB, Add; the slot appears in
      that day with a Generate button; generating + approving auto-schedules to
      that day; error state shows on a failed add; keyboard-navigable; both themes.
