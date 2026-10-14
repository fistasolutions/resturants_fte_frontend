# SPEC-079 — Orders Page Tabs: All / Returns / Cancelled / Discounted

## Problem
`/orders` has no way to see orders with a refund, a cancellation, or a discount code
applied. Owner decision: split the page into tabs — All (today's page, unchanged),
Returns, Cancelled, Discounted — each with the same filter bar (fulfillment,
location, age, date range, search) and the same drill-down (every row still opens
the existing `/orders/[id]` detail page). Depends on backend SPEC-071, which adds a
`view` query param to `GET /orders`/`GET /orders/export`.

## Solution
- **Route-based tabs, reusing the established pattern** (Settings SPEC-074, not a
  new client Tabs widget): `/orders` (All), `/orders/returns`, `/orders/cancelled`,
  `/orders/discounted` — each a real URL, survives reload, shareable/bookmarkable.
- **One shared body, four thin routes** — the current `app/(app)/orders/page.tsx`
  content (header, tabs strip, search/date/filters row, list panel) moves into a new
  `features/orders/orders-page-content.tsx` (`OrdersPageContent({ tab, searchParams
  })`, an async Server Component), parameterized by `tab: "all" | "returns" |
  "cancelled" | "discounted"`. Each route file becomes a one-line wrapper:
  ```tsx
  export default function Page({ searchParams }: Props) {
    return <OrdersPageContent tab="returns" searchParams={searchParams} />;
  }
  ```
  `tab === "all"` maps to `view: null` (today's behavior, unfiltered by view);
  the other three map straight to the matching backend `view` value.
- **New `features/orders/orders-tabs.tsx`** — server component mirroring
  `SettingsTabs`: `<Link>`s with `aria-current="page"`, active tab underlined. Each
  tab's href is built with `ordersPageHref(filters, 1, tabBasePath)` — **switching
  tabs preserves every other active filter** (fulfillment/location/age/date/search)
  and resets to page 1 (the result set changed, page N may not exist in the new tab).
- **`lib/order-filters.ts`:**
  - New `OrdersView = "returns" | "cancelled" | "discounted"`; `OrderFilters` gains
    `view: OrdersView | null`. `parseOrderFilters` always sets it `null` — `view` is
    route-derived (which page.tsx you're on), never parsed from the query string, so
    it can never leak into a bookmarked URL's query params.
  - `ordersApiQuery` (talks to the **backend**) gains `if (filters.view)
    params.set("view", filters.view)` — this is what actually makes the tab's
    filtering take effect, for both the list fetch and CSV export.
  - `ordersPageHref` (builds **frontend** page URLs) gains a `basePath: string`
    parameter (same pattern `DateRangePicker` already uses) — it does NOT put `view`
    in the query string; the route itself encodes the tab, keeping URLs clean
    (`/orders/returns?location=301`, not `/orders?view=returns&location=301`).
- **`features/orders/filters-bar.tsx`** — new required `basePath` prop, threaded
  into `commit()`'s `ordersPageHref(next, undefined, basePath)` call, so changing a
  filter while on the Returns tab stays on the Returns tab.
- **`features/orders/orders-list-panel.tsx`** — new optional `emptyMessage` prop
  (defaults to today's "No orders match the active filters."), so each tab's empty
  state names what's missing ("No returned orders match the active filters.", etc.).
- **"Send to manager" only renders on the All tab** — it links to `/orders/review`,
  a distinct overdue-orders-by-location escalation workflow (KPIs: hours overdue,
  value, package count) that doesn't have a Returns/Cancelled/Discounted concept and
  isn't being extended to one here. "Export CSV" stays on all four tabs — generic,
  and now correctly scoped via `view` in `ordersApiQuery`.
- **No change to `/orders/[id]`** — every row on every tab already links there via
  `OrdersTable`'s existing `href={`/orders/${order.id}`}`; nothing new needed.

## Acceptance Criteria
- [ ] Four tabs render above the filter row on all four routes, active tab
      visually distinct (`aria-current="page"`), each a real bookmarkable URL
- [ ] Returns/Cancelled/Discounted tabs show only the matching orders (verified
      against backend SPEC-071's `view` filtering)
- [ ] Setting a filter (e.g. Location) on any tab keeps you on that tab; switching
      tabs preserves that filter and resets to page 1
- [ ] Clicking any row on any tab opens the same existing `/orders/[id]` detail page
- [ ] "Send to manager" appears only on the All tab; "Export CSV" appears on all
      four and respects the active tab's `view`
- [ ] Each tab's empty state names the tab ("No returned orders...", etc.)
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green
- [ ] Manual check in a running browser (both themes): switch tabs with a Location
      filter active, confirm it survives; page to page 2 on Returns, confirm the URL
      and active tab don't reset

## Files
- `features/orders/orders-page-content.tsx` (new — shared body)
- `features/orders/orders-tabs.tsx` (new)
- `app/(app)/orders/page.tsx` (thin wrapper, tab="all")
- `app/(app)/orders/returns/page.tsx` (new, tab="returns")
- `app/(app)/orders/cancelled/page.tsx` (new, tab="cancelled")
- `app/(app)/orders/discounted/page.tsx` (new, tab="discounted")
- `lib/order-filters.ts` (`OrdersView`, `OrderFilters.view`, `ordersApiQuery`,
  `ordersPageHref`)
- `features/orders/filters-bar.tsx` (`basePath` prop)
- `features/orders/orders-list-panel.tsx` (`emptyMessage` prop)
- `tests/order-filters.test.ts` (extend for `view`/`basePath`)
