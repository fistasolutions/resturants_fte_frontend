# SPEC-093 — Product Catalog: summary tiles + Row/Grid toggle + product cards

## Context

The Catalog tab (`/products/catalog`, SPEC-090) is a bare wide table the client called "the
worst UI." Two asks: (1) **summary tiles at the top** that tell you *what* the catalog holds, and
(2) a **Row ⇄ Grid toggle** — Row keeps the dense table; Grid shows each product as a proper card
with all its figures. Also: the Overview tab should feel more like a **product dashboard** (more
tiles). All from data the backend already returns (`GET /analysis/products`) — the UI presents,
never computes a business metric (root Rule 8).

## Goal

Make the Catalog tab a scannable product dashboard: a composition tiles row + a Grid-of-cards
default with a one-click switch to the existing table; and enrich the Overview with the same
at-a-glance composition tiles.

## Design

### 1. Composition tiles — `lib/catalog-summary.ts` + `CatalogSummaryTiles`

- `catalogStatusCounts(rows): { total, best_seller, healthy, slow, dead_stock }` — a pure
  **count** of catalog rows by their **backend-assigned** `status` (presentation aggregation of a
  backend metric, not a new metric). Framework-free, unit-tested (root Rule 4).
- `CatalogSummaryTiles` (server component) renders four `VerdictTile`s: **Products** (total),
  **Best sellers**, **Slow movers**, **Dead stock** — reusing the shared tile so it matches the
  existing verdict tiles exactly. Used on both the Catalog tab (its header) and the Overview tab
  (the "more tiles" dashboard ask).

### 2. Row/Grid toggle — `CatalogView` (client)

- `"use client"` wrapper holding `useState<"grid" | "row">` (default **grid**). The toggle is a
  small segmented control (lucide `LayoutGrid` / `List`, `aria-pressed`). Switching is **instant,
  client-only** — all rows are already on the client, so no refetch/URL round trip (a URL param
  would trigger a server re-render; a pure view switch shouldn't). Renders `CatalogGrid` or the
  existing `CatalogTable`.

### 3. Product cards — `CatalogGrid`

- Responsive card grid (1 / 2 / 3 cols). Each card: title (truncate) + category + the
  backend `status` badge (same colour map as the table), and a compact metric grid — **Units,
  Revenue, Margin, Return, Sell-thru, Stock** — every value straight from the `CatalogRow`.
- **No product image:** `CatalogRow` carries none; cards are image-less (clean, status-accented).
  Real thumbnails would need a backend field — noted, out of scope here.
- Empty state mirrors the table's.

### 4. Wiring — `product-page-content.tsx`

- Catalog tab: `<CatalogSummaryTiles rows={data.catalog} />` then `<CatalogView rows={data.catalog} />`.
- Overview tab: add `<CatalogSummaryTiles rows={data.catalog} />` beneath the existing
  `VerdictTiles` (the "more tiles / dashboard" ask), before the commentary + category chart.

## Files

- `lib/catalog-summary.ts` (new) · `tests/catalog-summary.test.ts` (new)
- `features/products/catalog-summary-tiles.tsx`, `catalog-grid.tsx`, `catalog-view.tsx` (new)
- `features/products/product-page-content.tsx` (wiring)

## Acceptance criteria

1. Catalog tab shows a four-tile composition row (Products / Best sellers / Slow / Dead stock)
   above the catalog.
2. Catalog defaults to **Grid** cards; the toggle switches to the existing table and back
   **instantly** with no refetch; `aria-pressed` reflects the active view.
3. Each grid card shows title, category, status badge, and Units/Revenue/Margin/Return/Sell-thru/
   Stock from the backend row; empty state handled.
4. Overview tab shows the composition tiles beneath the four verdict tiles.
5. `catalogStatusCounts` unit tests pass; `npm test`, `npx tsc --noEmit`, `npm run lint`, and
   `npm run build` all green (root Rules 4 & 7). Semantic tokens only, both themes (Rule 9).

## Manual verification checklist (no jsdom runner — root Rule 4)

- `/products/catalog`: tiles render; Grid is default; toggle to Rows and back is instant; cards
  show all six metrics; long titles truncate; dead-stock/best-seller badges coloured correctly.
- `/products`: composition tiles appear under the verdict tiles.
- Switch tabs — the persistent shell header/tab bar stay (SPEC-090 unaffected).
- Verify light **and** dark themes.

## Non-goals

- No product images (needs a backend field). No test-data filtering (separate decision). No
  backend changes. No new metric computation in the UI — tiles count a backend-assigned status.
