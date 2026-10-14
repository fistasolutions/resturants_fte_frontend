# SPEC-024 — Inventory Analyst Page

- **Status:** Implemented
- **Date:** 2026-07-16
- **Backend:** `GET /analysis/inventory?period=` (SPEC-015 aggregate; period
  sets the sales-velocity window, default 30d).
- **Value orientation (owner decision):** what to reorder, what's stuck, what's
  bleeding — money-impact buckets, not a stock table.

## Changes

1. Nav: "Inventory" item (`/inventory`, Boxes icon).
2. `services/analysis.ts` — `getInventoryAnalysis(period)` (types shared in
   `types/analysis.ts`).
3. `app/(app)/inventory/page.tsx` (RSC) — headline counts (out-of-stock /
   low-stock, true store-wide numbers from SPEC-014) then buckets, each a
   `SectionCard` table:
   - **⛔ Selling but out of stock** — window revenue as the "demand you're
     missing" column.
   - **⚠️ Reorder now** — days-of-cover ascending (velocity-based).
   - **🧊 Dead stock** — headline: total products/units/value frozen; top by
     stock value.
   - **📦 Overstock** — days-of-cover > 90d, stock value at risk.
   - **Fast / Slow movers** — units in period.
   - **📍 By location** — units + tracked items per location.
4. Every velocity-derived number states its basis ("at last-30-days sales
   pace") — days-of-cover is a projection, marked as such.
5. Reuses `features/analysis/` primitives; period switcher shared pattern.

## Acceptance criteria

- [x] All buckets render from the live aggregate; counts match SPEC-014's
      true inventory counts.
- [x] Days-of-cover labeled with its velocity basis.
- [x] All four frontend gates green.

## Patches

- **2026-07-16 — verdict tiles + AI analyst panel added at the top (owner
  request; same treatment as the Product Analyst v2, SPEC-026).** New
  `features/analysis/inventory-verdict-tiles.tsx`: Out of stock (true count),
  Most urgent reorder (days of cover, estimate-labeled), Top missed seller
  (window revenue as missed demand), Cash frozen (dead-stock value +
  product count) — all from the aggregate's new `verdicts` key (no extra
  queries). The shared `AiCommentary` panel mounts with `page="inventory"`
  against the new cached `GET /analysis/inventory/commentary` endpoint.
  Everything below the panel is unchanged.
