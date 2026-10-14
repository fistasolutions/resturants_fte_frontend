# SPEC-080 — Order Detail's "Orders" Breadcrumb Returns to the Tab You Came From

## Problem
`app/(app)/orders/[id]/page.tsx`'s breadcrumb has a hardcoded `<Link href="/orders">
Orders</Link>`. From any of the SPEC-079 tabs (Returns/Cancelled/Discounted) plus
whatever filters were active, opening an order and clicking that breadcrumb always
lands back on the plain, unfiltered All tab — losing the tab and every filter. This
must survive a refresh too (not just work via the browser's own Back button), so it
needs to live in the URL, not client/history state.

## Solution
- `lib/order-filters.ts` — new `isSafeOrdersReturnPath(path: string): boolean`,
  strictly `/orders`, `/orders/returns`, `/orders/cancelled`, or `/orders/discounted`,
  each with an optional query string. Guards against trusting an arbitrary query
  param as a redirect target (never `startsWith("/orders")` alone — that would also
  pass something like `/orders.evil.example`).
- `features/orders/orders-table.tsx` — new optional `returnTo?: string` prop; when
  present, each row's link becomes `/orders/{id}?returnTo={encodeURIComponent(
  returnTo)}` instead of the bare `/orders/{id}`.
- `features/orders/orders-list-panel.tsx` — new required `basePath` prop (the
  active tab's route, already known by every caller since SPEC-079). Computes
  `returnTo = ordersPageHref(filters, page, basePath)` from its own live `page`
  state (not the server-rendered `filters.page` — paging happens client-side
  without a navigation, per SPEC-063, so the URL must reflect wherever the user has
  actually paged to) and passes it to `OrdersTable`.
- `features/orders/orders-page-content.tsx` — passes `basePath` through to
  `OrdersListPanel`.
- `app/(app)/orders/[id]/page.tsx` — gains a `searchParams` prop, reads `returnTo`,
  validates it with `isSafeOrdersReturnPath`, falls back to `/orders` if absent or
  invalid (e.g. someone opens `/orders/{id}` directly, no tab context to return to).
  Both breadcrumb Links (the normal render and the 404/error early-return) use the
  validated value.

## Acceptance Criteria
- [ ] From `/orders/discounted?location=301`, opening an order and clicking the
      "Orders" breadcrumb returns to `/orders/discounted?location=301` — tab and
      filters intact
- [ ] Paging to page 2 on any tab, then opening a row, returns to that same page 2
      on that tab (not page 1)
- [ ] Refreshing the order detail page and then clicking the breadcrumb still works
      (state lives in the URL, not client history)
- [ ] Opening `/orders/{id}` with no `returnTo` (e.g. a bookmarked/shared link)
      falls back to the plain `/orders` breadcrumb — no crash, no invalid link
- [ ] A malformed or foreign `returnTo` (e.g. `https://evil.example`) is rejected by
      `isSafeOrdersReturnPath` and falls back to `/orders`
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green
- [ ] Manual check in a running browser: Discounted tab → page 2 → open a row →
      click "Orders" breadcrumb → confirm you land back on Discounted, page 2

## Files
- `lib/order-filters.ts` (`isSafeOrdersReturnPath`)
- `features/orders/orders-table.tsx` (`returnTo` prop)
- `features/orders/orders-list-panel.tsx` (`basePath` prop, computes `returnTo`)
- `features/orders/orders-page-content.tsx` (thread `basePath`)
- `app/(app)/orders/[id]/page.tsx` (`searchParams`, validated breadcrumb href)
- `tests/order-filters.test.ts` (extend for `isSafeOrdersReturnPath`)
