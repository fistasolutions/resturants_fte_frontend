# SPEC-225 — Results › AI Value tab

Status: implemented
Depends on: backend SPEC-234 (the spend ledger, budget guard and `/ai-value` endpoints),
SPEC-188 (the Value Ledger tab this sits beside), SPEC-119 (instant header, skeleton below)
Mockup: `ref/ai-value-mockup.html`

## Problem

Fifteen-plus generative AI surfaces have been built — blog writing, hero images, social
images, video, carousels, chat, daily reports, forecasting commentary, supervision
emails. Nothing in the product says what any of them cost, and nothing says which are
worth keeping. The backend now meters every call; this is the screen that reads it.

## Why a tab on Results, not a new page

Cost is only half an argument. The other half — what an action was worth — already lives
on `/results` as the Value Ledger (SPEC-188). Putting spend on its own page would put the
two halves of one decision on two screens, and hand the cost number to an audience not
already asking the value question.

## The honesty rule, restated in the UI

The backend claims a value only where it is genuinely traceable (SPEC-207's standard) and
reports a `value_basis` everywhere else. **The UI must not soften that.** A surface with
`value: null` renders a basis chip — `not attributable`, `engagement only`, `operational`,
`pending attribution` — never a dash that reads like a missing number, and never an
inferred figure. Measurement coverage ("2 of 20 surfaces") is a headline tile, not a
footnote, because a page showing an ROI figure while hiding how little of it is measured
would be exactly the inference-presented-as-measurement the ledger refuses.

## Scope

### 1. `types/ai-value.ts`
View-model mirrors of the backend payload, camelCased at the adapter boundary like every
other type module.

### 2. `lib/ai-value.ts` — all derived logic, unit-tested
Components stay presentational; everything a test can assert lives here (the repo has no
jsdom runner, so `lib/` is where correctness is provable):

- `adaptAiValue(raw)` — snake_case API → camelCase view model.
- `verdictFor(surface, rank)` — the Earning / Watch / Review / Core / No spend verdict.
  **Derived, never claimed:** "Earning" requires a real attributed value that exceeds
  cost; "Review" is reserved for a top-three cost with no revenue signal — the case a
  human should actually decide on.
- `coverageSentence(totals)` — the one-line statement of how much is measurable.
- `formatUsd`, `unitsLabel` — display formatting, including token counts as `8.4M tok`.

### 3. `services/ai-value.ts`
`getAiValue(period)` via `serverApi`, returning the adapted view model.

### 4. `features/results/ai-value-tab.tsx`
Four KPI tiles (spend vs cap, attributable value, measurement coverage, projection), the
honesty callout, the full surface table, cost by job, expensive runs, and the budget-guard
panel. Semantic tokens only; no motion (root Rule 9).

### 5. Wiring
A new tab in `features/results/results-tabs.tsx`; `app/(app)/results/page.tsx` fetches it
in the existing `Promise.all` (root Rule 5 — never a waterfall). The route's `loading.tsx`
skeleton already covers the tab shell.

## Acceptance criteria

1. `/results` shows an **AI Value** tab beside Value Ledger.
2. Every surface the backend returns is listed, including ones with no spend.
3. A surface without an attributable value shows its basis chip, never a number.
4. Measurement coverage is a headline tile.
5. Spend is shown against the monthly cap with remaining and a labelled projection.
6. Cost by job distinguishes scheduled from on-demand.
7. Expensive runs are listed — where a runaway loop shows up.
8. Budget-guard caps and kill switches are visible with their paused reason.
9. All `lib/ai-value.ts` logic is Vitest-covered.
10. `npm test`, `npx tsc --noEmit` and `npm run build` all pass.

## Manual verification (no jsdom runner — root Rule 4)

- [ ] `/results` → AI Value tab renders in both light and dark themes.
- [ ] With an empty ledger the table lists every surface at $0.00 rather than a blank state.
- [ ] Tab is keyboard reachable and `aria-selected` tracks the active tab.
- [ ] Table scrolls horizontally on mobile without the page scrolling sideways.

## Patches

### 2026-09-09 — historic disclosure (backend SPEC-235)

The backfill recovers 57 days of AI activity from artifacts left behind before metering
existed. Text calls come back with **zero tokens**, because tokens were never recorded
and estimating them would be the fabrication this page exists to refuse.

That creates a new way for the page to mislead: thousands of runs sitting at `$0.00`
reads as "this surface is free". So `totals.historicCalls` / `historicUnits` are now
carried through the adapter and stated on the page — `historicNote()` renders the
disclosure, and the surface table shows a `pre-metering` chip on any row whose runs are
entirely historic. Historic rows are deliberately **not** counted as `unpricedEvents`: a
missing rate is a fixable configuration gap, an unmetered past is not.

### 2026-09-09 — period picker, defaulting to All time (backend SPEC-234 Patches)

The tab rendered whatever the page fetched and offered no control, so it was pinned to
the last 30 days — showing 4,534 of the 5,966 calls the ledger actually held, with the
first two months of the platform's history invisible and no way to reach them.

`PERIODS` (All time · 90d · 30d · This month) now drives a picker, **All time is the
default**, and narrowing refetches through `/api/proxy` rather than navigating — a
navigation would reset the Results tab back to Value Ledger. `PERIODS` lives in
`lib/ai-value.ts` so the option set is data, and testable.
