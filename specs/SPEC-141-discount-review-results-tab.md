# SPEC-141 — Results: "Discount Reviews" outcomes tab

Status: implemented
Depends on: backend SPEC-144 (discount_review outcomes), SPEC-067 (Results page)

## Problem

The supervision loop lets the owner email a location manager about over-discounting
(SPEC-139). He never sees whether it worked. The Results page (`/results`) is already
the single home for "did our send actions work?" — every send type (Overdue, Transfers,
Winback, Dead Inventory, Orders, Store Traffic) shows there with a ✓ Worked / → Too
early / ✗ No change verdict. Discount-review emails belong in that same page, not as a
separate one-off panel on the Discounts tab.

## Design

Backend now emits a `discount_review` outcome list on `GET /results` (SPEC-144). The
frontend just threads it through the existing Results plumbing — **no new component**.

- `types/results.ts`: `OutcomeLink` gains `{ type: "discounts" }`; `ResultsData` gains
  `discountReview: OutcomeEntry[]`.
- `lib/adapters.ts`: `ApiResults` gains `discount_review`; `adaptResults` maps it.
- `features/results/results-tabs.tsx`: `resolveLink` maps `"discounts"` →
  `/discounts/attention`; a new **"Discount Reviews"** tab (with its count badge).

The verdict wording comes from the backend ("Manual discounting at Central fell from
$10/day to $0/day since the email" → **Worked**), so the shared card renders it with no
special-casing.

## Removed (was the wrong home)

The earlier Discounts-tab duplicate is deleted: `features/discounts/outcomes-panel.tsx`,
`getDiscountAttentionOutcomes` (`services/discounts.ts`), the `DiscountOutcome(s)` types,
and the parallel fetch + panel wiring in the attention page/loading. Outcomes live only
on `/results` now.

## Manual verification checklist

- Email a location's manager (Discounts → Needs attention → send). Open **/results →
  Discount Reviews** → that location appears; within 3 days it's "Too early", after that
  "Worked" (discounting dropped) or "No change".
- The card's "View details →" links to `/discounts/attention`.
- Tab count badge correct; empty state "No sends yet."; light + dark; mobile.

## Acceptance Criteria

- [x] `discount_review` threaded through types → adapter → Results tab; new tab with
  count + shared card + `discounts` link.
- [x] Discounts-tab duplicate (panel, service fn, types, wiring) removed.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` (599), `npm run build` green.
