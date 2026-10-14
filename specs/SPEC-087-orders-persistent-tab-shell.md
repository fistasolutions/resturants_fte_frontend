# SPEC-087 — Orders Analyst Persistent Tab Shell

## Problem
Same bug SPEC-085 fixed for Inventory, now on **Orders** (tabs: All / Returns /
Cancelled / Discounted, SPEC-079). Each tab is a real route rendering one async
`OrdersPageContent` that `await`s `getOrders` + `getReportScopes` at the top and
only then paints header + tab bar + filters + table together; the sole loading
state, `orders/loading.tsx`, is a **full-page** skeleton. So every tab switch
tears down the whole page, flashes the full skeleton (the tab bar blinks out),
then repaints — the tab bar flickers on every switch.

## Solution
Exactly the SPEC-085 approach: move the persistent shell — **page header (title +
Send-to-manager/Export actions), the tab bar, and the filters row (search +
placed-date picker + Fulfillment/Location/Placed filters)** — into a Next.js
**layout** that wraps the Orders tab routes. The layout stays mounted across tab
switches, so the shell never re-renders; only the orders table below swaps, with a
content-only skeleton while that tab's page loads.

### New files
- `lib/order-tabs.ts` — pure, unit-tested: `ORDERS_TABS`, `OrdersTab` (moved from
  `orders-tabs.tsx`), `activeOrdersTab(pathname)` (exact match — `null` on any
  non-tab route like `/orders/[id]`, `/orders/review`, `/orders/returns-spike`),
  `isOrdersTabRoute(pathname)`. Tab links reuse the existing
  `ordersPageHref(filters, 1, basePath)` (carries every active filter across a
  switch, SPEC-079).
- `features/orders/orders-shell.tsx` — `"use client"`. Reads `usePathname`/
  `useSearchParams`, rebuilds `filters` via `parseOrderFilters` and the active tab
  from the path. On a tab route renders `<main>` + `PageHeader` (title "Orders",
  `filterSummary` description, Send-to-manager only on All + Export CSV) +
  `OrdersTabs` + the filters row (search `<form>`, `DateRangePicker`, `FiltersBar`)
  + `{children}`. On any non-tab route renders `{children}` bare. Receives
  `locations` (for the Location filter + summary) as a prop from the layout.
- `app/(app)/orders/layout.tsx` — async server layout: fetch
  `getReportScopes()` **once** (a layout is not re-run when navigating between its
  child routes), render `<OrdersShell locations={scopes.locations}>{children}</OrdersShell>`.

### Changed files
- `features/orders/orders-tabs.tsx` → `"use client"`, self-sufficient (active from
  `usePathname`, filters from `useSearchParams`); no more `active`/`filters` props.
- `features/orders/orders-page-content.tsx` — drops the header, tab bar, filters
  row, `getReportScopes` fetch, and its `<main>`; returns just the `OrdersListPanel`
  (the table). Still resolves `filters` (with the route-derived `view`) and fetches
  `getOrders` for that tab. The `getReportScopes` call moves to the layout (fetched
  once for the whole section instead of per tab — a small perf win too).
- `app/(app)/orders/loading.tsx` — content-only skeleton (just the table); no
  header/tab-bar/filters/`<main>` (the shell owns those and stays painted).

### Known trade-off (same as SPEC-085, documented)
`/orders/review`, `/orders/[id]`, `/orders/returns-spike` have no own `loading.tsx`
and fall back to `orders/loading.tsx`; after this change that fallback is main-less,
so during their sub-second load the skeleton lacks page padding. They are non-tab
routes that render their own header + `<main>` once loaded (unaffected), and their
prior fallback was already the wrong (orders-table) shape. Left as-is to keep the
change surgical.

## Acceptance Criteria
- [x] Switching between All / Returns / Cancelled / Discounted keeps the header,
      tab bar, and filters row painted — no full-page skeleton, no tab-bar flicker.
      **Done by construction** (shell in the persistent `layout.tsx`); manual check below.
- [x] Only the orders table swaps, showing a content-only skeleton until it loads —
      `orders/loading.tsx` trimmed to the table skeleton; shell stays mounted.
- [x] Active tab highlights instantly on click; `aria-current="page"` on the active
      tab — tab bar reads `usePathname`.
- [x] All active filters survive a tab switch (tab links carry them via
      `ordersPageHref`); Send-to-manager gated on `active === "all"` in the shell.
- [x] `/orders/[id]`, `/orders/review`, `/orders/returns-spike` still work — all
      compiled in `npm run build`; shell renders bare on non-tab routes.
- [x] `lib/order-tabs.ts` helpers unit-tested — `tests/order-tabs.test.ts`, 6 tests pass.
- [x] `npm test` (271 passed), `npx tsc --noEmit` (clean), `npm run lint` (changed
      files clean), `npm run build` (✓ Compiled successfully) all green.

## Manual verification (frontend has no jsdom runner — root Rule 4)
`npm run dev`, open `/orders`, both themes: click all four tabs — header + tabs +
filters stay put, active underline moves instantly, only the table skeletons then
fills. Apply a fulfillment + location filter and a placed-date range, switch tabs —
filters persist; Send-to-manager appears only on All. Open an order detail and the
Send-to-manager review page — no tab bar there, own header intact.

## Files
- `lib/order-tabs.ts` (new)
- `features/orders/orders-shell.tsx` (new)
- `app/(app)/orders/layout.tsx` (new)
- `tests/order-tabs.test.ts` (new)
- `features/orders/orders-tabs.tsx` (rewrite → client, self-sufficient)
- `features/orders/orders-page-content.tsx` (content-only)
- `app/(app)/orders/loading.tsx` (content-only skeleton)
