# SPEC-251 — Products → Costs: where the owner tells the platform what a garment really cost

**Date:** 2026-09-16 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-256-landed-cost-engine.md` (`/costs/*`)
**Builds on:** `SPEC-090` (Product Analyst tabs), `SPEC-185` (True Profit),
`SPEC-230` (client data cache), `SPEC-232` (persistent shells), `SPEC-239` (Brands),
`SPEC-229-in-app-docs.md` (Rule 11)

## Problem

Every margin the product shows is `price − Shopify's unit cost`. Backend SPEC-256 now
holds a dated landed cost per variant — freight, duty, brokerage, insurance,
handling, shrinkage, in the invoice's currency — and every margin query reads it
first. But nothing lets the owner put a shipment in, see what each line will cost
before it is recorded, set the assumptions the engine falls back on, or check that
what was recorded reconciles to the invoices. Without that surface the engine is a
table nobody fills.

## Behaviour

1. **A new Product Analyst tab — `Costs` at `/products/costs`**, last in the tab
   bar (`lib/product-tabs.ts`), rendered inside the persistent product shell like
   every other tab, prefetched on the server and read through the client cache
   (`lib/queries/costs.ts` → `costsQueries.summary({ from, to })`, path
   `/costs/summary?start=…&end=…`). The shell's range picker owns the period; the
   tab defaults to the last 90 days.

2. **Four tiles at the top** (`KpiStrip`, built by `lib/costs.ts`
   `coverageTiles`): *Cost coverage* (share of the period's sales on lines with any
   known cost — landed or Shopify — tone `bad` and a "below the 50 % floor" sub-line
   when flagged), *Landed coverage* (share on lines with a landed cost), *Variants
   costed* (with a landed cost / selling in the period), *Shipments recorded* (in
   the period). No ✦ Explain — the analyst has no tool for these figures.

3. **Record a shipment** (`features/products/costs-shipment-card.tsx`): the header
   fields (reference, supplier, received date, invoice currency, FX rate — hidden
   when the currency is the base — allocation method, and the five invoice totals
   with duty / handling explicitly "leave blank if not on the invoice"), a CSV
   picker, and a **Preview** that posts to `/costs/shipments/preview` and renders
   every line's allocated components and landed unit cost, the shipment totals
   (invoices / assumptions applied / landed), and a warning when the reference
   already exists. **Record** posts the identical form to `/costs/shipments`, then
   invalidates the summary so the tiles, reconciliation and shipment list move at
   once. Every backend 422 renders its message and, when present, the per-row
   `details` list verbatim. A "Download template" action gives the four-column CSV
   header so the owner never guesses the format.

4. **Enter one variant by hand** (`features/products/costs-manual-card.tsx`):
   a search box (`/costs/variants?q=`, debounced, ≥ 2 characters) listing SKU,
   product, Shopify cost and the latest landed row; picking one opens the per-unit
   form (effective date, currency + FX, unit cost, freight, duty, brokerage,
   insurance, handling — duty / handling blank = assumption) and `PUT
   /costs/variants/{id}`; the response's row is shown back with the components
   that came from an assumption named.

5. **Assumptions** (`features/products/costs-assumptions-card.tsx`): base
   currency (read-only — the store's), shrinkage %, inbound handling per unit,
   default duty %, and a small editable list of product type → duty %. `PUT
   /costs/assumptions`. The card says plainly that assumptions apply to what is
   recorded from now on, never to past lots.

6. **Reconciliation** (`features/products/costs-reconciliation-card.tsx`): for
   the period — landed cost recorded, invoices entered, the variance, and the
   variance lines the backend names (assumptions applied; an unexplained residual
   only if one ever appears), plus the count of manual entries (which have no
   invoice and are listed, never folded in).

7. **Shipments** (`features/products/costs-shipments-table.tsx`): the latest
   shipments — reference, supplier, received date, currency @ rate, method, lines,
   units, invoices, landed — with a delete (confirm dialog) that calls `DELETE
   /costs/shipments/{id}` and invalidates the summary. A **Re-resolve all lines**
   button runs `POST /costs/refresh` (a repair action; ~1 min on the live store —
   the button says so) and reports lines updated + elapsed.

8. **Nothing is calculated in the browser.** `lib/costs.ts` only adapts, formats,
   validates the header before it is sent (FX required when the currency is not
   the base, received date and reference required, totals numeric) and builds
   tiles; the numbers on every card are the backend's.

## Implementation

- `lib/product-tabs.ts` — `costs` tab; `tests/product-tabs.test.ts` updated.
- `types/costs.ts` — the `/costs/*` response shapes.
- `lib/costs.ts` — adapters, `coverageTiles`, `validateShipmentHeader`,
  `shipmentFormData`, `CSV_TEMPLATE`, formatting helpers; `tests/costs.test.ts`.
- `lib/queries/costs.ts` — `costsPaths` + `costsQueries.summary`; registered in
  `tests/query-registries.test.ts`. `services/costs.ts` — the `serverApi` face.
- `app/(app)/products/costs/page.tsx` — prefetch + `<CostsTab>`;
  `features/products/product-analysis-tabs.tsx` gains `CostsTab`;
  `features/products/costs-view.tsx` composes the five cards.
- Mutations go through `fetch("/api/proxy/costs/…")` like every other client
  write (iPacky import, tax report generation), and invalidate
  `["costs"]` through the shared `QueryClient`.
- Docs (Rule 11): `lib/docs/content/products.ts` gains the Costs section and its
  prose about landed margin; `updated` bumped; the overview's principles note that
  margin now prefers the landed cost. Screen capture pending — the section says so.

## Acceptance criteria

1. `/products/costs` renders inside the product shell with the tab active; the
   summary is prefetched and cached — **done**.
2. Tiles show coverage, landed coverage, variants costed, shipments; a coverage
   below 50 % is flagged — **done**.
3. A shipment can be previewed and then recorded from a CSV plus header fields;
   every backend refusal is shown with its rows — **done**.
4. A variant's landed cost can be entered by hand after a search — **done**.
5. Assumptions can be read and saved — **done**.
6. The reconciliation and the shipment list render from the summary; a shipment can
   be deleted; a full re-resolve can be run — **done**.
7. `lib/` logic unit-tested; `npm test`, `npx tsc --noEmit`, `npm run build` green —
   **done** (outputs in the summary).
8. Docs updated in the same change — **done**.

## Manual verification checklist (no component runner — Rule 4)

- Open `/products/costs` on the live app: four tiles, five cards, tab highlighted.
- Preview the template CSV with two real SKUs: every line shows its landed unit
  cost; a made-up SKU shows the "row N" error; blank FX on a EUR invoice is refused.
- Record it: shipments table gains the row, tiles and reconciliation move, True
  Profit for those products changes on the next visit.
- Delete it: tiles return to their previous values.
- Both themes; keyboard through the forms; phone width.
