# SPEC-081 — Store Transfer Opportunities (per-location drill-down)

## Problem
Client request: clicking a store (Jackson, Pomona, Lawrence — the dashboard's
Location Intelligence cards) should show its stock shortages and what could be
transferred in from other stores. Depends on backend SPEC-075
(`GET /analysis/inventory/location-transfers/{location_id}`).

## Solution
- **Entry point**: `features/dashboard/location-cards.tsx` — each card gets a
  second CTA, "Transfer opportunities", next to the existing "Review orders"
  link, to `/inventory/store-transfers/{location_id}`. Omitted for the "Online"
  bucket (`location_id === null`) — there's no physical store to receive a
  transfer.
- **List page** `app/(app)/inventory/store-transfers/[locationId]/page.tsx`
  (Server Component, same structure as `dead-inventory-alerts/page.tsx`):
  breadcrumb `Inventory Analyst → {Location} Transfers`, a dense summary strip
  (styles available, total units available, window), then a table — same visual
  language as `DeadInventoryReview` (rank, style, sizes-at-source badges,
  client-side pagination) — reused, not recreated, adapted for this view's
  fields (source location + stock/value, this store's own demand + current
  stock instead of "selling elsewhere").
- **Detail sub-page**
  `app/(app)/inventory/store-transfers/[locationId]/[productId]/page.tsx` —
  same no-new-endpoint pattern as the Dead Inventory Alerts detail page: re-fetch
  the list, select the matching `product_id` from its `opportunities` array (no
  new backend call). Breadcrumb `Inventory Analyst → {Location} Transfers →
  {Product}`. Visual structure mirrors `DeadInventoryDetail`'s hero (image +
  "Move from {source} → {this location}" flow + stats grid + full size-breakdown
  table) — **minus the Send button**: this is a read-only visibility feature
  (per backend SPEC-075's own scope note); wiring a notify/send action is a
  separate, later decision.
- **Types** (`types/analysis.ts`): `LocationTransferOpportunity`,
  `LocationTransferOpportunities`, mirroring the backend response 1:1.
- **Service** (`services/analysis.ts`): `getLocationTransferOpportunities(
  locationId)` — no try/catch (matches `getOrderDetail`, not
  `getDeadInventoryAlerts`) so the page can distinguish a 404 (unknown location)
  from a generic fetch failure, same as the order detail page's `ApiError`
  handling.

## Acceptance Criteria
- [ ] Each Location Intelligence card (except Online) has a working "Transfer
      opportunities" link
- [ ] `/inventory/store-transfers/{locationId}` lists every transfer-in
      candidate for that location, ranked by that location's own demand
- [ ] Each row links to its own breadcrumbed detail page; the detail page shows
      the full size breakdown at the source location, not just the list's badges
- [ ] An unknown location id shows a clear "doesn't exist" message, not a crash
      or blank page (404 handling mirrors the order detail page)
- [ ] No send/notify action anywhere in this feature — visibility only
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green
- [ ] Manual check in a running browser (both themes): dashboard → a location
      card → Transfer opportunities → a row → detail page → breadcrumb back

## Files
- `types/analysis.ts` (`LocationTransferOpportunity`, `LocationTransferOpportunities`)
- `services/analysis.ts` (`getLocationTransferOpportunities`)
- `features/inventory/location-transfer-review.tsx` (new)
- `features/inventory/location-transfer-detail.tsx` (new)
- `app/(app)/inventory/store-transfers/[locationId]/page.tsx` (new)
- `app/(app)/inventory/store-transfers/[locationId]/[productId]/page.tsx` (new)
- `features/dashboard/location-cards.tsx` (new CTA)
