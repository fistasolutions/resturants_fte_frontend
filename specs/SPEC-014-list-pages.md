# SPEC-014 — Data List Pages (Orders · Products · Customers · Inventory · Discounts · Returns) + Analytics

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (Design.md §14 Tables: search, sorting,
pagination, loading + empty states)

## Goal

The seven remaining nav destinations, built on ONE reusable table system — not seven
bespoke tables.

## Shared table system

- **Pure logic** `lib/table.ts` (+ full unit tests): `filterRows` (case-insensitive
  across searchable keys), `sortRows` (string/number, asc/desc, stable),
  `paginate` (+ `pageCount`, clamped page). UI contains no data logic.
- **`components/shared/data-table.tsx`** (client, generic over row type):
  labeled search input (debounced 250ms), sortable column headers (buttons with
  `aria-sort`), pagination footer (Prev/Next + "Page x of y" + result count),
  empty state (no data vs no matches — different messages), right-aligned numeric
  columns. Column defs (with cell renderers) live in per-domain **client** components
  (functions can't cross the server boundary).
- **`components/shared/page-header.tsx`** — h1 + description + actions slot.

## Domains (types → `lib/mock/` fixtures → `services/` → `features/<domain>/*-table.tsx` → page)

- **Orders** `/orders`: number, customer, items, channel, total, status
  (paid/pending/refunded badges), date. 12 fixture rows.
- **Products** `/products`: product (title + SKU), category, price, inventory
  (low/out flagged with warning/destructive text), sold, status (active/draft). 12 rows.
- **Customers** `/customers`: name, email, orders, total spent, type
  (new/returning badge), last order. 10 rows.
- **Inventory** `/inventory`: product/variant, SKU, location, available, incoming,
  status (in stock / low / out badges). 12 rows — counts consistent with the
  dashboard's 12-low/5-out alerts.
- **Discounts** `/discounts`: code, type (percentage/fixed), value, used, status
  (active/scheduled/expired), start/end dates. 8 rows, 8 high-discount products
  consistent with dashboard.
- **Returns** `/returns`: order, customer, amount, reason, status
  (pending/approved/refunded), date. 6 rows; totals consistent with the $1,230 /
  4 refunds dashboard card.
- **Analytics** `/analytics`: composed from existing feature components (KPI cards,
  RevenueChart, ChannelDonut, TopProducts) with the same query-driven header chips
  pattern as the dashboard — no new chart code.

All seven nav items flip to `enabled: true`; dashboard "View all"/"View details"
ComingSoonButtons for orders/products/inventory/returns become real links
(`components/shared/view-link.tsx`), per SPEC-004's promise.

## Acceptance Criteria

1. Each list page renders header + searchable/sortable/paginated table of typed mock
   rows with status badges; searching nonsense shows the no-matches empty state.
2. `lib/table.ts` fully unit-tested (filter/sort/paginate incl. edge cases).
3. Analytics reuses dashboard components; no duplicated chart code.
4. Sidebar: all items enabled; dashboard card links navigate to the real pages.
5. Lint, tsc, tests, build green; every route compiles and serves 200.
