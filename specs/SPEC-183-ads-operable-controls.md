# SPEC-183 — Performance Ads: make the page operable

**Status:** frontend slice. Completes backend **SPEC-198/199** and frontend SPEC-182.
**Depends on:** SPEC-182 (the live wiring), backend SPEC-199 (proposer + settings).
**Governs:** the controls on `/ads`. Additive.

## Why

SPEC-182 pointed the page at the real backend, and it now truthfully renders… nothing,
because there is no way to make anything exist from the UI. Three gaps:

1. **No way to create a campaign.** `POST /ads/campaigns` exists; `campaigns-tab.tsx`
   has no buttons at all.
2. **No way to set the monthly cap.** Every approval is checked against it, and it can
   only be changed by writing to the database, so the strip reads `$0` and the store
   ceiling never binds.
3. **The kill switch is fake.** `ads-shell.tsx` holds `paused` in `useState` and
   `budget-strip.tsx` calls `onToggle` — local React state that forgets on reload and
   never reaches the backend. This is the same defect SPEC-182 removed from the gate
   card (Hold/Undo), one component over, and it is worse here: it is the control that
   stops all spending.

## Scope

1. **`types/ads.ts`** — `BudgetSummary` gains `killSwitchActive` and `monthlyCapSet`
   (backend SPEC-199, additive); new `AdsSettings`.
2. **`services/ads-actions.ts`** — `createCampaign`, `updateAdsSettings`.
3. **Kill switch — real.** `AdsShell` seeds `paused` from `budget.killSwitchActive`
   (the backend's truth, not a guess), calls `setKillSwitch`, and `router.refresh()`es.
   A failure surfaces its message and **leaves the toggle where it was** — a stop button
   that reports success it did not achieve is the most dangerous control on the page.
   The resume copy states what actually happens: campaigns stay paused and must each be
   approved again.
4. **Create campaign** — a dialog on the Campaigns tab (shadcn `Dialog`, existing
   components). Creates a `draft`; the copy says so, since only an approved gate makes
   anything live.
5. **Monthly cap** — an inline control on the budget strip, prompting when
   `monthlyCapSet` is false.
6. Tokens only, both themes, no Framer Motion (Rule 9).

## Tests

- `lib/ads-controls.ts` (new, pure): validates campaign input (name required, caps
  non-negative, daily ≤ total) and cap input. Unit-tested — that is where logic goes so
  Vitest can reach it (no component runner — Rule 4).
- Adapter: the two new `BudgetSummary` fields map and default safely.
- `npm test`, `tsc`, `lint`, `build` green.

## Acceptance criteria

- [ ] A campaign can be created from the UI and appears as a draft.
- [ ] The monthly cap can be set from the UI and the strip reflects it.
- [ ] The kill switch calls the backend, survives a reload, and reports failures
      without lying about the state.
- [ ] Validation is pure and unit-tested.
- [ ] Tests, tsc, lint, build green.

## Patches

- **2026-08-31 — implemented.**
  - `lib/ads-controls.ts` (pure validation, 10 unit tests); `services/ads-actions.ts`
    gains `createCampaign` + `updateAdsSettings`; `features/ads/create-campaign-dialog.tsx`;
    a monthly-cap dialog on the budget strip; `BudgetSummary` + adapter carry
    `killSwitchActive` / `monthlyCapSet`.
  - **The kill switch stopped being local state entirely.** The first pass mirrored
    `budget.killSwitchActive` into `useState` and synced it with an effect — which ESLint
    correctly flagged (`setState` in an effect). The better fix was to delete the state:
    `paused` is now *derived* from the prop, with `router.refresh()` after a toggle. One
    source of truth is the backend, which is exactly what the old local-state version got
    wrong — it forgot on reload and could disagree with the server after a guardrail or
    another session changed it. A failed call moves nothing and shows the error.
  - Copy is deliberate throughout: creating a campaign says it makes a **draft** that
    spends nothing, and releasing the stop says campaigns stay paused and must each be
    approved again — because that is what the backend actually does.
  - **Verified:** `npm test` 1014 passed (96 files), `tsc` clean, `lint` 0 errors
    (3 pre-existing warnings in untouched files), `build` compiled in 5.1s.

## Acceptance criteria — verified 2026-08-31

- [x] A campaign can be created from the UI and appears as a draft.
- [x] The monthly cap can be set from the UI and the strip reflects it.
- [x] The kill switch calls the backend, survives a reload (derived from server state,
      not remembered), and reports failures without lying about the state.
- [x] Validation is pure and unit-tested.
- [x] Tests, tsc, lint, build green.
- [ ] Manual browser walkthrough — not done; the flow was proven end to end through the
      live API instead (see backend SPEC-199 Patches).
