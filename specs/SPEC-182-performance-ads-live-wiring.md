# SPEC-182 — Performance Ads: swap the mock for the live backend

**Status:** frontend slice. Consumes backend **SPEC-198** (the money-safety engine).
**Depends on:** SPEC-111 (the mock MVP that designed `types/ads.ts`), backend SPEC-198.
**Governs:** how the `/ads` route gets its data and how spend decisions are acted on.

## Why

SPEC-111 shipped the Performance Ads UI on `lib/mock/ads.ts` deliberately, so the
trust/gating surface could be validated before any backend existed. That backend now
exists: twelve endpoints under `/api/v1/ads/*` returning exactly the shapes
`types/ads.ts` declares.

So the page currently shows **invented campaigns with invented ROAS**. Every number on
it is fiction. That was correct while there was nothing behind it and is now actively
misleading — worse than an empty state, because it looks like data.

## Scope

1. **`services/ads.ts` → live.** Each of the six readers calls `serverApi()` against its
   endpoint, through an adapter. The module stays the single data seam SPEC-111 built it
   to be, so **no component changes** — that was the whole point of designing the
   contract first.

2. **`lib/adapters.ts` — six adapters.** The backend already returns camelCase matching
   `types/ads.ts`, so these are thin, but they are **not** pass-throughs: every numeric
   field defaults to `0` and every list to `[]` when absent. A missing field must render
   as an honest zero, never `undefined` or `NaN` on a page about money. Pure, so Vitest
   covers them (no component runner exists — root Rule 4).

3. **`services/ads-actions.ts` (new)** — client mutations through `/api/proxy`, matching
   `services/spotlight-actions.ts` exactly: `approveGate`, `rejectGate`,
   `pauseCampaign`, `setKillSwitch`. Kept out of `services/ads.ts` because that module
   is server-only.

4. **Spend Gates tab — make the buttons real.** Today Approve/Reject only set local
   component state (`setDecision`), so a "decision" survives nothing. They now call the
   backend and reflect the true outcome, including **the refusals**: approving while the
   kill switch is on, or past the monthly cap, returns a 409 whose message must be shown
   to the operator rather than swallowed. A gate that was refused must NOT render as
   approved.

5. **Empty states are honest.** With no campaigns, no gates and no spend — which is the
   real state of this store today — every tab renders its zero state rather than
   pretending. `AccountabilityData.connected` is `false` from the backend, so the
   existing setup nudge is finally telling the truth.

## Explicitly NOT in scope

Connecting Meta or Google Ads, or anything that spends money. Backend SPEC-198 has no
platform client and this slice adds none. Per `docs/prd.md`, real spend needs its own
separate owner sign-off.

## Tests

- Adapter units: every field maps; a payload missing numbers yields `0` not `NaN`; a
  payload missing lists yields `[]`; `utilization` above 1 is preserved, never clamped
  (the backend reports overspend honestly and the UI must not hide it).
- `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green (Rule 7).

## Manual verification checklist (no component runner — Rule 4)

- [ ] `/ads` renders live data; no `lib/mock/ads.ts` import remains in `services/`.
- [ ] Approving a gate persists and the row leaves the pending list.
- [ ] Approving while the kill switch is on shows the backend's refusal message.
- [ ] Both themes correct; keyboard order unchanged.

## Acceptance criteria

- [ ] All six readers hit the live API through adapters; mock no longer imported by the
      service layer.
- [ ] Mutations go through `/api/proxy` and surface backend error messages verbatim.
- [ ] A refused approval never renders as approved.
- [ ] Adapters unit-tested for missing/zero/overspend cases.
- [ ] Tests, tsc, lint, build green.

## Patches

- **2026-08-31 — implemented.**
  - `services/ads.ts` rewritten against `serverApi` — all six readers hit
    `/api/v1/ads/*` through new adapters. **No component changed**, which is exactly
    what SPEC-111's contract-first design promised.
  - Six adapters in `lib/adapters.ts`. Imported with aliases (`OverviewData as
    AdsOverviewData`, `ActivityItem as AdsActivityItem`) — both names already exist in
    `types/spotlight.ts` and collided.
  - `services/ads-actions.ts` (new): `approveGate`, `rejectGate`, `pauseCampaign`,
    `setKillSwitch` via `/api/proxy`, matching `services/spotlight-actions.ts`.
  - **UI defect fixed while wiring, beyond the stated scope but on a money page.**
    The Spend Gates card offered **Hold** and **Undo** buttons that only set local
    component state. Neither exists in the backend: a pending gate *is* on hold, and an
    approved gate cannot be un-approved (SPEC-198 returns 409 on a second decision). So
    both buttons pretended to do something on the screen that authorises spending.
    Removed, replaced with Approve/Reject that call the backend, a pending spinner, and
    an `role="alert"` panel that shows the backend's refusal message verbatim —
    a refused approval now stays pending instead of rendering as approved.
    `router.refresh()` after a decision, since an approval can launch a campaign and
    move the budget strip.
  - **One obsolete test suite removed, its coverage replaced.** `tests/ads.test.ts`'s
    "ads services (mock seam)" block asserted that the FIXTURES contained both channels,
    every status and every guardrail kind. Those were assertions about the mock's
    completeness; against a live backend they would be asserting the merchant's data
    rather than our code, and `services/ads.ts` is now `server-only` so the node test
    env cannot import it at all. Equivalent coverage moved to
    `tests/ads-adapters.test.ts` (14 tests) which pins what is actually ours: the
    mapping, the honest-zero defaults, and the unclamped overspend.
  - `lib/mock/ads.ts` is left in place, matching how `lib/mock/spotlight.ts` and the
    other Phase-1 fixtures were kept after their features went live.

- **Verified against the running stack**, not just the build. Logged in as the real
  store user, all six endpoints returned 200 with exactly the contract keys:
  `/ads/budget` → `periodLabel, totalCap, spent, remaining, utilization, liveCampaigns`;
  `/ads/overview` → `kpis, blendedTrend, nextCampaign, activity`;
  `/ads/campaigns` → `campaigns, recommended`; `/ads/gates` → `gates`;
  `/ads/accountability` → `connected, ledger, capUtilization, guardrails`;
  `/ads/creatives` → `creatives`. All four `/ads` tab URLs return 307 to login
  (auth redirect, no render error).
- **Suite:** `npm test` 1003 passed (94 files), `npx tsc --noEmit` clean,
  `npm run lint` 0 errors (3 pre-existing `no-img-element` warnings in untouched
  files), `npm run build` compiled in 4.0s.

## Acceptance criteria — verified 2026-08-31

- [x] All six readers hit the live API through adapters; the mock is no longer imported
      by the service layer.
- [x] Mutations go through `/api/proxy` and surface backend error messages verbatim.
- [x] A refused approval never renders as approved (the gate stays pending and the
      refusal is shown in an alert).
- [x] Adapters unit-tested for missing/zero/overspend cases (14 tests).
- [x] Tests, tsc, lint, build green.
- [ ] Manual browser checklist — **not walked through**. The store has no campaigns,
      gates or spend yet, so every tab currently renders its zero state; the populated
      paths are covered by unit tests and the backend's own 54 tests until the first
      campaign exists.
