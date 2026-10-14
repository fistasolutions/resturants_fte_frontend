# SPEC-038 — Unfulfilled Drill-Down: Orders Page, Report Links, CSV Export

- **Status:** Implemented
- **Date:** 2026-07-21
- **Backend:** SPEC-032-orders-drilldown-csv-export.md (`GET /orders` filters
  `fulfillment`/`location`/`age` + `GET /orders/export` CSV).
- **Client request (2026-07-21, Sir Usman voice notes 2–4 + screenshot):**
  pressing "Online" (or any location) in the report's "Unfulfilled orders by
  location" table should "open up a new window of all those orders", with a
  way to export the list for "the people who are in charge".

## Design

### 1. New pure module `lib/order-filters.ts` (unit-tested)

- `parseOrderFilters(searchParams)` → validated `{fulfillment, location,
  locationName, age, q, page}` (garbage → null/defaults; `loc_name` is
  display-only and length-capped).
- `ordersApiQuery(filters, limit, offset)` → the backend query string
  (shared by the list fetch and the export link so they can never drift).
- `drilldownHref(row, age?)` → the orders-page URL for a report row
  (`location_id null` → `location=online`; carries `loc_name`).
- `AGE_LABELS`, `fulfillmentLabel`, `filterChips(filters)` → display labels.

### 2. New route `app/(app)/orders/page.tsx` (RSC, server-paginated)

Modeled on `reports/history` (SPEC-035): URL is the state, `force-dynamic`,
`PAGE_SIZE = 25`.

- `PageHeader` — title "Orders"; description names the active slice (e.g.
  "Unfulfilled · Jackson · 48h+"); actions: **Export CSV** (a plain anchor
  to `/api/proxy/orders/export?…` with the `download` attribute — the proxy
  streams the backend CSV with its attachment headers) and "Back to
  reports".
- Filter chips row (removable — each chip links to the URL without its
  param) + a GET search form (`q` → backend `search`).
- shadcn `Table`: Order, Placed, Customer, Location, Items, Fulfillment,
  Total. Fulfillment renders "Unfulfilled" for null status. Empty state
  names the active filters. Server-side pagination (Previous/Next links,
  "Page x of y · N orders").
- Not in the sidebar — reached from report links (nav stays per SPEC-018).

### 3. Report table drill-down links (`features/reports/report-v2-view.tsx`)

Every row in "Unfulfilled orders by location": the location cell and Total
link to the filtered orders page; the 0–24h / 24–48h / 48h+ cells add the
matching `age` param. Links open in a new tab (`target="_blank"`
`rel="noopener"` — the client asked for "a new window"; the report stays
put). Zero-count bucket cells stay plain text. Link styling: underline
decoration on hover + focus ring, tokens only (Rule 9).

## Out of scope

Emailing the export to a per-location owner (client voice note 4, second
half) — needs email infrastructure; V2 backlog Theme A. The CSV download
covers the manual send today.

## Tests (Rule 4)

`tests/order-filters.test.ts` — parse/validate every param (incl. garbage),
API-query building, drill-down hrefs for online/POS rows with and without
age, chip removal URLs. All four gates green.

## Acceptance criteria

- [x] Clicking any location/bucket number in the report opens the orders
      list filtered to exactly those orders (counts match the report).
- [x] Export CSV downloads the same filtered list.
- [x] Search + pagination compose with the filters; URL is shareable.
- [x] Suites + `tsc` + lint + production build green.

## Manual verification checklist

- [ ] Report → click "Jackson" 48h+ cell → new tab lists the same count the
      report showed; export downloads them.
- [ ] "Online / unattributed" row → `location=online` list.
- [ ] Remove chips one by one → list broadens accordingly.
- [ ] Keyboard: chips, search, pagination, export all reachable; links
      announce their purpose.
- [ ] Both themes; 375px (table scrolls inside the card, page doesn't).
