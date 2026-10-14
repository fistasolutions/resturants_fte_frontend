# SPEC-137 — Weekly Plan Board (Content Studio "Generate Weekly Plan")

Status: implemented
Repo: ecommerce-fte-frontend
Depends on: SPEC-110 (Social Growth shell), SPEC-133/134/135/136 (Content Studio),
SPEC-131/132 (Calendar + approve→schedule flow), backend Weekly Plan endpoints.

## Why

Content Studio (SPEC-135) drafts one product at a time. This adds the flagship
**Generate Weekly Plan** experience: one click asks the AI planner to lay out the whole
week, and the merchant reviews a **7-day plan board** where every slot already carries
the product, day, channel, occasion, campaign name and the "why this product" rationale.
Each slot generates its draft on demand (or all at once), and the approve → auto-schedule
handoff is made explicit — approving a planned post auto-schedules it onto the Calendar
(the backend owns scheduling; the UI only surfaces it).

This conforms to `docs/` and the root Absolute Rules: the AI plans/interprets, the
backend computes/schedules (Rule 8); no store mutation; semantic tokens only, and the
"building" animation is **CSS-only** — staged pulse + an indeterminate progress bar,
like the Spotlight writing loader — **no framer-motion, no entrance animations** (Rule 9).

## Backend contract (built, camelCase, authoritative)

- `POST /social/weekly-plan/generate` → `{ id, weekStart, title, slots: Slot[] }`
  (runs the AI planner, ~10–30s — show the building animation).
- `GET  /social/weekly-plan` → `{ plan: { id, weekStart, title, slots: Slot[] } | null }`.
- `POST /social/weekly-plan/slots/{slotId}/generate` →
  `{ post: { postId, channel, creative, hasImage, plannedFor }, slot: Slot }`
  (draft is created `in_review` with a pre-assigned schedule).
- `Slot` = `{ slotId, productId, productName, imageUrl, channel, scheduledDate,
  occasion, campaignName, reason, reasonDetail, rationale, postId, postStatus }`.

Approving a planned post auto-schedules it onto the Calendar (backend) — surfaced, not
built here.

## Scope

### Types (`types/social.ts`)
- `PlanSlot`, `WeeklyPlan`, `WeeklyPlanResult` (`{ plan: WeeklyPlan | null }`),
  `PlannedPostDraft` (the returned `post`), `SlotGenerateResult` (`{ post, slot }`) —
  matching the contract exactly, camelCase, no `any`.

### Services (`services/social-actions.ts`, client → `/api/proxy`)
- `generateWeeklyPlan(): Promise<WeeklyPlan>`
- `fetchWeeklyPlan(): Promise<WeeklyPlanResult>`
- `generatePlanSlot(slotId: number): Promise<SlotGenerateResult>`
All typed, surfacing the shared error envelope like the existing actions.

### Pure logic (`lib/social-plan.ts`, unit-tested — no JSX/fetch)
- `weekdayName(dateISO)`, `planDayLabel(dateISO)`, `addDaysISO(dateISO, n)` — UTC-based
  so bare "YYYY-MM-DD" days are never zone-shifted (mirrors `lib/social-calendar.ts`).
- `buildPlanBoard(plan): PlanDay[]` — the 7 canonical days from `weekStart` (Sunday→…)
  plus any slot date outside that window, sorted ascending, each with its grouped slots.
- `slotIsGenerated(slot)`, `ungeneratedSlots(plan)`, `mergeSlotIntoPlan(plan, slot)`
  (immutable replace by `slotId`).
- Generate-all reducer: `initGenAll(total)`, `recordGenAll(state, ok)`,
  `finishGenAll(state)`, `genAllDone(state)`, `genAllProgressLabel(state)`.

### UI
- **`features/social/weekly-plan-board.tsx`** (`"use client"`): the third right-area
  mode. States: hydrating (skeleton) / empty ("No plan yet…") / building (CSS loader) /
  ready (board) / error (retry). On mount `fetchWeeklyPlan()` hydrates a persisted plan;
  a `generateNonce` prop (bumped by the top-right button) triggers `generateWeeklyPlan()`;
  own **Generate all**, **Regenerate plan**, and **← Back to products** controls. Each
  slot card shows thumbnail + name, channel (`ChannelBadge`), occasion badge, prominent
  `campaignName`, `rationale`, `ReasonChip` + `reasonDetail`, and a per-slot **Generate**
  → "Generated ✓" + caption preview + "Review in Approvals" link + "Approve it and it
  auto-schedules for {date}." **Generate all** runs ungenerated slots sequentially with
  "n of m" progress, resilient to one failing (continue + report).
- **`features/social/content-studio-tab.tsx`**: a header row with a top-right
  **Generate Weekly Plan** button; a `plan` mode alongside product-browser/generate.
  The board is kept mounted (hidden) so its plan persists and hydration runs once.
- **`app/globals.css`**: `.plan-building-bar` indeterminate CSS bar (tokens only,
  disabled under `prefers-reduced-motion`).

## Acceptance criteria

1. `POST/GET/POST-slot` typed actions exist and go through `/api/proxy`. — done
2. Top-right **Generate Weekly Plan** button switches to the plan view and runs the
   planner, showing a CSS-only building animation while it runs. — done
3. Existing plan hydrates on load (persists across refresh); **Regenerate plan** offered. — done
4. 7-day board: `title` heading, slots grouped by day (weekday + date), each showing
   product, channel, occasion, campaign name, rationale, reason detail. — done
5. Per-slot **Generate** → "Generated ✓" + caption preview + "Review in Approvals"
   (`?tab=approvals`) + auto-schedule line. — done
6. **Generate all** generates every ungenerated slot sequentially with visible n-of-m
   progress, resilient to failures. — done
7. Loading / empty / error states everywhere; tokens only, both themes, responsive
   (stacks on mobile, horizontal day columns on desktop); no entrance animations. — done
8. Pure logic unit-tested (`tests/social-plan.test.ts`); `npm test`, `npx tsc --noEmit`,
   `npm run lint`, `npm run build` all green. — done

## Manual verification checklist (no jsdom runner)

- Content Studio → top-right **Generate Weekly Plan** → building animation ("Building
  your week…", staged pulse + moving bar) → board renders with the plan title.
- Board groups slots by day (weekday + date); each card shows channel, occasion badge
  (when set), campaign name prominent, rationale, reason chip + detail.
- A slot's **Generate** → "Generated ✓", caption preview, "Review in Approvals" link to
  `?tab=approvals`, and "Approve it and it auto-schedules for {date}."
- **Generate all** → "Generating n of m…" progresses; if one fails the rest continue and
  the summary reports the failure; already-generated slots render generated on load.
- Refresh the tab → the plan re-hydrates (persists). **Regenerate plan** rebuilds it.
- Toggle light/dark — tokens hold in both. Keyboard: button, back, per-slot generate,
  and the Approvals link are all reachable and operable.
- `prefers-reduced-motion` — the building bar/pulses fall to a static state.
