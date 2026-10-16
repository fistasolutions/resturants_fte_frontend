# SPEC-390 — Reputation Manager screens and the tracker's rating

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-408 · **Plan:** backend
SPEC-401 (W8)

## What

- **The tracker asks** (`features/storefront/rate-order.tsx` on `/track/<token>`): when the backend says
  `canRate`, five stars, then the complaints (1–3) or the praise (4–5) as taps, an optional comment and
  Send rating (`ratePublicOrder`, public). Once rated it thanks the guest and shows what they said.
- **`/reputation`** (restaurant brands only; `RestaurantShell`, `REPUTATION_PAGE`): period 7/30/90 days;
  tiles (average, ratings, 4–5 stars share, waiting for a reply); **What guests say** (themes) and **By
  branch** (average, ratings, most-said complaint); the ratings filtered by Waiting / 1–2 / 4–5 / All,
  each with stars, guest, branch, order number, tags, comment and its reply box: **Draft a reply**,
  **Save**, **Send** (all `network.manage`, registered in `lib/action-permissions.ts`); a sent reply shows
  read-only with when it was answered.
- **The employee**: nav item "Reputation Manager" (Star, within `/employees`), `EmployeeKey`
  `reputation`, its character (a side-swept bob holding a rating star), the hub card from the backend.
- Doc `lib/docs/content/reputation.ts`. Pure half `lib/reputation.ts`.

## What FOC sees (Rule 12)

Nothing — the page is absent without the `restaurant` feature and the tracker exists only for the
brand's own orders.

## Acceptance criteria

1. The tracker asks once the order arrived; the guest's rating is saved once and thanked.
2. The page shows the summary, themes, branches and ratings; replies are drafted, edited and sent by a
   role that may; others see the reason.
3. Unit tests for `lib/reputation.ts`; navigation, character, registry and docs pins updated.

## Verification (2026-10-16)

`tests/reputation.test.ts` (3): AC 3 done; pins updated (`navigation`, `employee-character`,
`query-registries`, `docs`, `role-gate-coverage`). Full suite 2767 passed, `tsc` clean, lint 0 errors.
AC 1–2 against backend `tests/test_restaurant_reputation.py` and the demo check.
