# SPEC-272 — Continuous Innovation → Plans: the CEO decides in the app

**Repo:** frontend · **Status:** implemented 2026-09-17 · **Backend:** SPEC-271
(`/ci/plans*`) · **Builds on:** SPEC-253 (the `/ci` feed), SPEC-230 (client cache),
SPEC-232 (persistent shells) · **Mockup:** `ref/mockups/ci-plans.html` (approved)

## Why

`/ci` shows what was built; the decision about what to build next still happened in
chat. The owner asked for a **Plans** tab: every proposal is a card; he opens it,
reads it, and at the end says **Yes** or **No**. Yes turns the card green with who and
when. No requires *why not* and *how it should look instead* — both saved — and the
card turns red with his words on it.

## Scope

- `/ci` gets a tab bar in its shell: **Reports** (the SPEC-253 feed, unchanged) and
  **Plans**. The bar lives in the shell (no data-derived counts on it), so a switch
  never re-paints the header.
- `/ci/plans` — the list: three tiles (awaiting · accepted · rejected — with the effort
  still awaiting), a status filter, the cards newest first, **New plan** (the team's
  door — a dialog: title, one line, why now, what you get (one per line), where it
  lives, value, effort, optional image).
- `/ci/plans/[id]` — the plan: In one line · Why now · What you get · Effort / Where
  it lives / The value · What it looks like (the image, when one exists) · **Your
  decision** — Yes / No. No reveals two required boxes (≥ 10 characters each; Save
  stays disabled until both are filled; the backend's 422 names the box). A decided
  plan shows its verdict instead of the buttons. The rail beside it: status, proposed,
  effort, decided by, decided on. **Edit** / **Remove** for an awaiting plan.
- Cards: awaiting = neutral with an amber pill; accepted = `--success` border + tint +
  "Accepted by … on …"; rejected = `--destructive` border + tint + the two texts.
  Status colours are the semantic tokens; brand red is never used.

Out of scope: roles (everyone signed in sees both sides — the PRD keeps roles Coming
Soon; the decision records **who**), reopening a decision (a new plan answers the
notes), comments, notifications, AI.

## Data

- `lib/queries/ci-plans.ts` — `ciPlanPaths` + `ciPlanQueries.list()` /
  `.plan(id)`, keyed under `["ci-plans"]`; `services/ci-plans.ts` is the `serverApi`
  face; `services/ci-plans-actions.ts` the writes (create · update · remove · decide ·
  uploadImage · `planImageHref`). Writes invalidate the `["ci-plans"]` prefix.
- `lib/ci-plans.ts` — the pure half: adapters, `PLAN_STATUS_LABEL`, `filterPlans`,
  `planCounts`, `formatEffort`, `rejectionProblems`, `parseGets`, `decisionLine`.
- `types/ci-plans.ts` — `CiPlan`, `CiPlanList`, `PlanStatus`, `PlanDraft`.

## Files

`app/(app)/ci/plans/{page,loading}.tsx`, `app/(app)/ci/plans/[id]/{page,loading}.tsx`,
`features/ci/ci-shell.tsx` (tabs), `features/ci/ci-tabs.tsx`, `features/ci/plans-view.tsx`,
`plan-card.tsx`, `plan-reader.tsx`, `plan-decision.tsx`, `plan-dialog.tsx`,
`lib/docs/content/ci.ts` (Plans + the plan sections), `tests/ci-plans.test.ts`,
`tests/query-registries.test.ts` (registry pinned).

## Acceptance criteria

1. `/ci` shows Reports | Plans in the shell; the feed is unchanged; switching tabs
   keeps the header node (no re-mount).
2. `/ci/plans` renders from the client cache (prefetched, `HydrationBoundary`); the
   tiles and cards match `GET /ci/plans`; filter chips narrow without a request.
3. New plan → dialog → `POST` → the list refreshes and the new card is first.
4. Open a card → the plan page with every section and the decision block.
5. Yes → the card and the page go green with name and date; the buttons are gone.
6. No → both boxes required; Save disabled until both have ≥ 10 characters; the
   backend's 422 shows under the right box; success → red card with both texts.
7. Edit / Remove exist only while awaiting.
8. Loading skeletons for both routes; error states through the route boundary; empty
   state for a store with no plans.
9. `tests/ci-plans.test.ts` green; registry test green; `tsc`, lint, build green;
   the in-app doc has the Plans sections.

## Manual verification (no component runner)

See the bottom of this file after implementation.

## Verification (2026-09-17)

`tools/capture_ci_plans.mjs` against the running app (dev servers, Railway DB ≈ 650 ms/hop):

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Reports \| Plans in the shell; feed unchanged; header node kept | done — `main h1` tagged before Plans → Reports → Plans still carries the tag |
| 2 | List from the cache; tiles = cards; filter without a request | done — Rejected chip narrows to 1 card, no fetch |
| 3 | New plan dialog → POST → new card first | done — dialog with a 2.2 MB image → card 9.4 s (image upload + refetch) |
| 4 | Card → plan page with every section + decision | done — 4.0 s cold `goto` |
| 5 | Yes → green, name + date, buttons gone | done — "Accepted by Ecommerce FTE on Sep 17, 2026" |
| 6 | No → both boxes required; Save disabled until both ≥ 10; stored; red card with both texts | done — disabled with none / one, enabled with both; row read back rejected with both texts |
| 7 | Edit / Remove only while awaiting | done — 1 on awaiting, 0 on accepted |
| 8 | Skeletons, error state, empty state | done — `plans-skeleton.tsx` both routes; `QueryErrorState`; "No plans yet." |
| 9 | Gates | done — `tests/ci-plans.test.ts` 10 passed; registry pinned; **1756 tests / 153 files green**; tsc clean; lint 0 errors (3 pre-existing `<img>` warnings elsewhere); `npm run build` green (`/ci/plans`, `/ci/plans/[id]`); doc sections + 3 screens through `build_docs_screens.py` |

Captures: `ref/screens/ci-plans-2026-09-17/` (list · open plan · New plan dialog ·
reject form · accepted plan · Reports tab).
