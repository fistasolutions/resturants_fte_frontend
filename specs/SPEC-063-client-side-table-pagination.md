# SPEC-063 — Client-side pagination for Inventory Transfers & Customers "Due to reorder"

## Problem
On the Inventory Analyst page and the Customers page, clicking Next/Prev (or
searching, on Customers) used a plain `<Link>`/`<form method="get">` to a new URL
with a different `searchParams` value. Since each page is a single async Server
Component that reads `searchParams` at the top, App Router has to re-run the
**entire** page function for that navigation — every section refetches and
remounts (KPI tiles, hero strip, segment cards, dead-stock section, AI
commentary), not just the paginated table. The underlying backend calls were
already cheap (money-finder segments are 15-minute cached; inventory panel's
transfers slice is its own query) — the cost was the perceived UX: a full-page
flash for what should be a single table update.

## Fix
Two components became self-contained client components that own their own
paged/searched slice of data and fetch it directly from a standalone backend
endpoint via the browser's `fetch`, bypassing Next.js route navigation entirely:

- `features/analysis/transfer-table.tsx` — now `"use client"`, takes
  `initialData` + `query` (the `start=…&end=…` range string) instead of
  `data`/`prevHref`/`nextHref`. Paging calls
  `GET /api/proxy/analysis/inventory/transfers?...&page=N&page_size=20`
  (the standalone endpoint the combined `/inventory/panel` route already uses
  internally) and swaps only the table body + footer. `app/(app)/inventory/page.tsx`
  no longer reads or forwards a `transfers_page` search param — it always
  fetches page 1 server-side and hands off to the client component.
- `features/customers/due-to-reorder-table.tsx` (new) — owns the search input,
  page, and table together, calling
  `GET /api/proxy/customers/money-finder?page=N&limit=15&q=...` and reading the
  `due_to_reorder` slice of the response. `app/(app)/customers/page.tsx` still
  does the initial server fetch (honoring a deep-linked `?page=`/`?q=` for the
  first paint) but no longer renders the search form, table, or pagination nav
  itself.

Neither component updates the URL on subsequent pages/searches — deep-linking
to page 1 (or a `?q=` search term) on first load still works; paging beyond
that is session-local, matching how the `/brief/transfers` review page already
behaves for its own send-tracking state.

## Acceptance criteria
- [x] Clicking Next/Prev on the Inventory Analyst transfer table no longer
  re-fetches or re-renders the analysis tiles, dead-stock section, reorder
  table, or AI commentary.
- [x] Clicking Next/Prev or searching on the Customers page no longer
  re-fetches or re-renders the hero strip or segment cards.
- [x] Clicking Next/Prev on the Orders page no longer re-renders the filter
  bar, date picker, or header.
- [x] Paging or applying filters on the Winback review page no longer
  re-renders the sync button or header.
- [x] Deep-linking `/customers?page=2` (or `/inventory` with a date range, or
  `/orders?page=2`, or `/brief/winback?page=2`) still loads the correct
  initial page server-side.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green.

## Patches
- 2026-07-29: Extended the same fix to the two components flagged as a known
  follow-up above. `features/orders/orders-list-panel.tsx` (new) — client
  component owning table + pagination only; paging fetches
  `GET /api/proxy/orders?...&page=N` directly. Deliberately does **not** make
  the search box client-side too: "Export CSV" and "Send to manager" are
  plain server-rendered links built from the current URL's filters
  (including `q`), so changing the search term still navigates — making it
  client-only would silently point those two actions at a stale query.
  `features/brief/winback-review-table.tsx` (new) — owns search, both numeric
  filters, and pagination together (no such export/send dependency on this
  page), calling `GET /api/proxy/brief/winback?...` directly.
