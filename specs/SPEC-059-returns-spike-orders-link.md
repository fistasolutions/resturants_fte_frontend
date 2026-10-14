# SPEC-059 — Returns Spike Card Links to Filtered Orders

## Problem
The dashboard's "Returns Spike" alert card names one product with an abnormal return
rate, but its "View orders" button links to a static, unfiltered `/orders` — clicking it
doesn't actually show orders for that product. Depends on backend SPEC-053, which adds
`product_id` to the `returns_spike` dashboard payload and a `product` filter to
`GET /orders`.

## Solution
- `types/analytics.ts` — add `returnsSpikeProductId: number | null` to `AlertsSummary`.
- `lib/adapters.ts` — map `dashboard.returns_spike?.product_id ?? null` (mirrors the
  existing `returnsSpikeProduct`/`returnsSpikeRate` mapping); update the `returns_spike`
  raw-payload type to include `product_id: number | null`.
- `lib/order-filters.ts` — add `product: string | null` (numeric id, validated like
  `location`) and `productName: string | null` (display-only, mirrors
  `locationName`/`loc_name`) to `OrderFilters`. Thread both through
  `parseOrderFilters`, `ordersApiQuery` (as `product`/`product_name`... wire param is
  just `product`, matching the backend's SPEC-053 query param), and `ordersPageHref`.
  Add a chip in `filterChips()` (label = `productName ?? `Product ${product}``,
  `removeHref` clears both `product` and `productName`) so the filter is visible and
  removable on `/orders`, same UX as the existing location filter.
- `app/(app)/dashboard/page.tsx` — build the Returns Spike card's `actionHref` from
  `ordersPageHref({ product: String(returnsSpikeProductId), productName:
  returnsSpikeProduct })` when a spike is active, instead of the static `"/orders"`.
  (`AlertCard` never renders the action link in its `allClear` state, so this only
  matters when `returnsSpikeProduct`/`returnsSpikeProductId` are both non-null.)

## Acceptance Criteria
- [x] Clicking "View orders" on an active Returns Spike card lands on `/orders`
      filtered to that product (`returnsSpikeHref`); falls back to plain `/orders`
      if a spike is somehow reported without a product id (defensive, shouldn't
      occur given the backend always returns both together)
- [x] Orders page header summary includes the product name when the filter is
      active (`filterSummary` → `filterChips`, same mechanism as the existing
      location filter)
- [x] The product chip's `removeHref` clears both `product` and `productName`,
      returning to the unfiltered orders list (consistent with every other
      filter — there's no distinct visual "chip" affordance for any filter today,
      only the header summary text + FiltersBar selects; product has no
      FiltersBar select since there's no bounded product list to choose from,
      matching how drill-down-only filters like `age`-from-report-links work)
- [x] `npm test` green (219 passed), `npx tsc --noEmit` clean, `npm run lint`
      clean on touched files, `npm run build` green
- [ ] Manual check in a running browser (both themes, spike-present and
      all-clear states) — not done in this pass; verify before shipping to users

## Files
- `types/analytics.ts`
- `lib/adapters.ts`
- `lib/order-filters.ts`
- `app/(app)/dashboard/page.tsx`
- `tests/order-filters.test.ts` (if present) / `tests/adapters.test.ts` — extend
