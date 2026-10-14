# SPEC-076 — Orders Table Doesn't Refresh When Filters Change

## Problem
Changing a filter on `/orders` (fulfillment, location, age, date range, search) does
navigate — the URL, `FiltersBar`'s selected values, and the page subtitle
(`filterSummary`) all update correctly, because those read `filters` fresh from the
server on every render. But the actual order rows stay exactly as they were before
the filter change.

Root cause: `OrdersListPanel` (`features/orders/orders-list-panel.tsx`) seeds its own
state once — `useState(initialOrders)` — to support client-side paging without a full
navigation (SPEC-063: Next/Prev fetches straight from the API instead of re-rendering
the whole route). React preserves that component instance's state across a soft
navigation (same position in the tree, no remount), so when a *filter* changes and the
server passes a new `initialOrders` prop, the panel keeps rendering its stale local
`orders` state — the new prop is silently ignored. Visually this reads as "only the
filter controls reloaded, not the table."

## Solution
- `app/(app)/orders/page.tsx` — pass `key={ordersApiQuery(filters)}` to
  `<OrdersListPanel>`. `ordersApiQuery(filters)` (called without limit/offset) already
  serializes exactly the filters that should force a fresh table — fulfillment,
  location, product, age, date range, search — and deliberately excludes `page`
  (`ordersApiQuery` never reads `filters.page`), so paging via the panel's own
  Next/Prev buttons does not change the key and does not remount the panel. Any other
  filter change produces a new key, which is React's documented pattern for
  "reset state when these specific inputs change" — the panel fully remounts and
  re-seeds `orders`/`page` from the fresh, correctly filtered `initialOrders`.
- No change needed inside `orders-list-panel.tsx` itself — the SPEC-063 client-side
  paging behavior (Next/Prev fetch without navigating) is correct and untouched.

## Acceptance Criteria
- [ ] Changing any filter (fulfillment/location/age/date range/search) immediately
      shows the correctly filtered rows, not the previous unfiltered set
- [ ] Paging via Next/Prev within an unchanged filter set still fetches via
      `/api/proxy/orders` without a full navigation (SPEC-063 behavior preserved,
      verified by the panel *not* remounting — its own `page` state persists across
      a Next/Prev click, unlike a filter change)
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green
- [ ] Manual check in a running browser: set Fulfillment=Fulfilled, confirm only
      fulfilled orders render; add a Location filter, confirm rows narrow further;
      page to page 2, confirm the filter dropdowns/URL stay put and rows update

## Files
- `app/(app)/orders/page.tsx`
