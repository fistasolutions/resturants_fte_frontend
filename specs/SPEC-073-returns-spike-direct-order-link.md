# SPEC-073 — Returns Spike Rows Link Straight to an Order, Not the Filtered List

## Problem
SPEC-070 put the Returns Spike list on its own subpage but kept each row's action
linking to the filtered `/orders?product=X` list (SPEC-059) — a manager still has
to click through the list to reach an actual order. Owner decision: simplify to one
hop — each row should open a representative order's detail page directly. Depends
on backend SPEC-068, which adds `order_id` (the product's most recently refunded
qualifying order) to `GET /dashboard/returns-spike-top`.

## Solution
- `types/analytics.ts` — `ReturnsSpikeItem` gains `orderId: number | null`.
- `lib/adapters.ts` — `adaptReturnsSpikeTop` maps the new `order_id` field through.
- `app/(app)/orders/returns-spike/page.tsx` — each row's link becomes `/orders/
  {item.orderId}` (the existing order-detail route, `app/(app)/orders/[id]/
  page.tsx`) when `orderId` is present, labeled "Order details" instead of
  "Orders". Falls back to the existing filtered-list link (`returnsSpikeHref`,
  unchanged, still imported) only if the backend ever returns a null `orderId`
  (shouldn't happen given the qualification rule, but the endpoint's type is
  nullable and a broken `/orders/null` link is worse than a graceful fallback).

## Acceptance Criteria
- [ ] Clicking a row's link with a non-null `orderId` navigates straight to
      `/orders/{orderId}` — the existing order detail page, no intermediate list
- [ ] If `orderId` is null (defensive case), the row falls back to the existing
      filtered `/orders?product=...` list rather than a dead link
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green
- [ ] Manual check in a running browser: from `/orders/returns-spike`, click a
      row, confirm it lands on that order's detail page (both themes)

## Files
- `types/analytics.ts`
- `lib/adapters.ts`
- `app/(app)/orders/returns-spike/page.tsx`
- `tests/adapters.test.ts` (extend `adaptReturnsSpikeTop` coverage)
