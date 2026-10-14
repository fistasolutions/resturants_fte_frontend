# SPEC-157 — Spotlight Daily Picks tab (frontend)

**Status:** done
**Repo:** `ecommerce-fte-frontend`
**Consumes:** backend SPEC-155 (`/spotlight/daily-picks`, `/history`, `/{date}`,
`/refresh`).
**Governs:** an **additive** new Spotlight tab. Does not change any existing tab.

## Problem

Backend SPEC-155 produces a dated daily snapshot of the top-10 ranked blog-title
picks (research agent titles over backend-ranked query clusters). The UI needs a
surface to show today's picks, browse previous days, seed a draft from a pick, and
force a refresh.

## Design

- **New tab** `daily-picks` (label "Daily Picks"), inserted after "Inbound Engine" in
  `SPOTLIGHT_TAB_IDS` and the tab bar. URL-driven like the other Spotlight tabs.
- **Server-rendered** (`DailyPicksTab`) via the existing service seam
  (`services/spotlight.ts` → `serverApi`). The page fetches today's snapshot
  (`getDailyPicks`, generated on demand by the backend when missing) and the history
  index (`getDailyPicksHistory`) **in parallel**; a past date (`?date=YYYY-MM-DD`,
  validated) loads on top only when requested (`getDailyPicksForDate`).
- **History strip**: real anchors (`?tab=daily-picks&date=…`), the active day
  highlighted, "Today" clears the param. Hidden when ≤1 day of history.
- **Pick card**: rank, agent title, angle, "what fills it", intent + persona badges,
  featured-product count, the backend score as a percent, a labelled score-part
  breakdown (Demand / Margin / Catalog / Brand fit — display only, root Rule 8), the
  rationale, and a **"Write this"** button that seeds a draft by keyword
  (`/spotlight/draft/new?keyword=…`, reusing `GenerateDraftButton`).
- **Refresh** (`RefreshPicksButton`, client island): POSTs `/daily-picks/refresh`
  through `/api/proxy`, shows a busy state, then `router.refresh()`. Only shown when
  viewing today; errors surface inline and leave existing picks in place.
- **Pure logic** in `lib/spotlight.ts`: `formatPickScore` (clamped 0–100, non-finite →
  0) and `DAILY_PICK_SCORE_PARTS` (the score-part display order). Adapter
  `adaptDailyPicksSnapshot` / `adaptDailyPicksHistoryEntry` in `lib/adapters.ts`.

## Design-system / Rule-9 compliance

- Semantic tokens only (`bg-primary/10`, `text-muted-foreground`, `border-border`, …);
  no hardcoded colors, no brand red for status.
- **No entrance animations.** The only motion is the shadcn button hover and the
  refresh/generate busy spinners (in response to a click). Content renders instantly.
- Loading (`SpotlightContentSkeleton` via keyed `<Suspense>`), empty (no picks), and
  error (tab-level catch + inline refresh error) states all handled. Responsive: the
  card, history strip, and score bars wrap/scroll on narrow screens.

## Tests (Vitest — pure logic + adapter)

`tests/daily-picks.test.ts`: `formatPickScore` (rounding, clamp, non-finite),
`daily-picks` tab registration, `DAILY_PICK_SCORE_PARTS` order, and
`adaptDailyPicksSnapshot` / `adaptDailyPicksHistoryEntry` (snake→camel, source
coercion, missing-field tolerance). **8 tests.**

## Verification

- `npx tsc --noEmit` — **done** (clean).
- `npm run lint` on touched files — **done** (clean).
- `npm test` — **done** (74 files, 684 tests green, incl. the 8 new).
- `npm run build` — **done** (compiled successfully; `/spotlight` route builds).

## Manual verification checklist (no component runner yet)

1. `/spotlight?tab=daily-picks` shows today's ranked picks with score bars.
2. History strip navigates to a past day; "Today" returns; active day highlighted.
3. "Write this" opens the streaming draft/new surface seeded by the pick keyword.
4. "Refresh picks" (today only) rebuilds and re-renders; error shows inline on failure.
5. Empty state renders on a store with no picks; both light and dark themes clean.

## Patches

- **2026-08-22 — "View draft" state.** A pick that has already been written now
  shows **"View draft →"** (linking to `/spotlight/draft/{id}`) plus its status pill,
  instead of "Write this" — using the backend's read-time `draft_id`/`draft_status`
  (SPEC-155 patch). Added `draftId`/`draftStatus` to the `DailyPick` type + adapter.
  Daily Picks now tracks its own drafts end to end (write → view) without bouncing to
  the Inbound Engine. Tests: two new adapter cases in `tests/daily-picks.test.ts`
  (absent → null; attached → mapped). Full `npm test` (686), `tsc`, `lint`, `build`
  green.

### 2026-09-14 — "Refresh picks" regenerated on the server but the tab kept the old set

**Symptom (owner report):** click Refresh picks → spinner → the list and the
"Generated … · Manual refresh" stamp do not change; a hard reload shows the new
picks. **Cause:** a SPEC-230 regression. `POST /spotlight/daily-picks/refresh`
does rebuild today's snapshot and returns it, but `RefreshPicksButton` discarded
the response and called `router.refresh()` — which re-runs the server route, while
since SPEC-230 the tab renders `spotlightQueries.dailyPicks()` from the client
cache, which that refresh never touches (`staleTime` 60 s, and hydration does not
overwrite fresher client data). **Fix:** the button now writes the returned
snapshot into the cache (`queryClient.setQueryData(spotlightQueries.dailyPicks()
.queryKey, snapshot)`) and invalidates `dailyPicksHistory()` so the day dropdown
shows the new generation time; `router.refresh()` and the transition are gone —
one request, instant update. Same pattern as SPEC-230's rule for mutations
("where a mutation changes data a view shows, it invalidates the view's key") and
`features/settings/use-settings-field.ts`.
