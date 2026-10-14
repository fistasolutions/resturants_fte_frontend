# SPEC-040 — Shopify Range Picker on Product Analyst, Inventory Analyst, Orders

- **Status:** Implemented
- **Date:** 2026-07-21
- **Backend:** SPEC-033-analysis-orders-date-range.md (`start`/`end` on
  `/analysis/*` + commentary range-keyed cache; `start`/`end` on `/orders`
  + export).
- **Owner request (2026-07-21):** "the same filter like Shopify we added on
  the dashboard must be on all these three pages: Product Analyst,
  Inventory Analyst, Orders."

## Design

### 1. `DateRangePicker` generalized (`features/dashboard/date-range-picker.tsx`)

New props (dashboard behavior unchanged by defaults):

- `basePath` (default `"/"`) — the page the URL commits to.
- `showCompare` (default `true`) — analyst/orders pages hide the compare
  select (they have no delta semantics; never offer a dead control).
- `allowAllTime` (default `false`) — Orders only: an "All time" entry at
  the top of the preset list; applying it clears the range params.
- `from`/`to`/`preset` accept `null` (the all-time state).
- The picker now merges into the CURRENT URL via `useSearchParams` —
  unrelated params (orders filters, search) survive a range change; it
  deletes/rewrites only `range/from/to/date/period/compare/page`.

### 2. Product + Inventory Analyst pages

- The 7/30/90-day `PeriodSwitcher` is REPLACED by the picker
  (`showCompare={false}`); component + `ANALYSIS_PERIODS` removed.
- URL: `?range=<preset>` or `?from&to`; legacy `?period=7d|30d|90d` keeps
  resolving (those are preset keys). Default preset: **30d** (unchanged
  page default).
- `services/analysis.ts` — `getProductAnalysis`/`getInventoryAnalysis`
  take `{from, to}` and call `?start=&end=`.
- `AiCommentary` takes a prebuilt `query` string (`start=…&end=…`) so the
  narrative always describes exactly the visible range (backend caches per
  range key).

### 3. Orders page

- Picker (`allowAllTime`, no compare) joins the filter bar; default is
  **All time** (the page's existing behavior).
- `lib/order-filters.ts`: `OrderFilters` gains `from`/`to` (validated ISO,
  future-clamped, inverted pairs swapped); `ordersApiQuery` emits
  `start`/`end` (shared by list + export — they can never drift);
  `ordersPageHref` carries `from`/`to`, so the filter selects and
  pagination preserve the range.

## Tests (Rule 4)

`tests/order-filters.test.ts` — from/to parsing (garbage, future clamp,
swap), query emission, href round-trip. Existing date-range suite already
covers preset math. All four gates green.

## Acceptance criteria

- [x] All three pages carry the same picker; analyst pages default to
      30 days, Orders to All time.
- [x] Legacy `?period=` analyst URLs still resolve (Rule 7).
- [x] Analyst numbers + AI commentary follow the selected range exactly.
- [x] Orders range composes with fulfillment/location/age/search and the
      CSV export.

## Manual verification checklist

- [ ] Products: pick "Yesterday" → best/worst sellers change; commentary
      regenerates for that range; `?period=30d` old link still works.
- [ ] Inventory: custom 2-week range updates fast/slow movers.
- [ ] Orders: range + Unfulfilled + location + search compose; export
      matches; "All time" clears the range.
- [ ] Both themes; keyboard; 375px.
