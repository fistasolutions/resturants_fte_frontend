# SPEC-102 — Inventory Analyst: per-tab data split, per-tab skeletons, By-Location dashboard

**Status:** ✅ shipped 2026-08-07. Consumes backend **SPEC-100**
(`/analysis/inventory/by-location`). Pure API consumer (Rule 8); tokens only, both
themes, no entrance animation (Rule 9).

## Problems fixed (owner review of the Inventory Analyst page)

1. **One generic skeleton for all 6 tabs.** Only `/inventory/loading.tsx` existed, so
   every tab flashed the same 4-tiles-and-blocks skeleton regardless of its real
   content → layout shift.
2. **Whole-panel refetch on every tab (duplication).** All 5 range tabs rendered the
   shared `InventoryPageContent`, which fetched `getInventoryPanel` (analysis +
   transfers + dead-stock) — so every tab paid for data it didn't show, and Dead Stock
   re-fetched dead-stock already in the panel.
3. **`DeadStockSection` rendered on TWO tabs** (Overstock & Movers *and* Dead Stock).
4. **"By Location" was one thin table** (location / units / items) — near-empty.

## Changes

- **Per-tab data split (dedup).** `InventoryPageContent` now fetches only its slice:
  overview/reorder/overstock-movers → `getInventoryAnalysis` (+ overview's commentary);
  transfers → `getInventoryTransfers` + `getTransferPlan` (no analysis blob, no
  dead-stock). Dead Stock and By Location are their own pages/fetches. No tab pays for
  data it doesn't render.
- **Dead-stock de-duplicated.** Removed `DeadStockSection` from Overstock & Movers — it
  lives only on the Dead Stock tab now. Overstock & Movers = overstock + fast + slow.
- **Per-tab skeletons.** A `loading.tsx` per tab folder (overview/reorder/
  overstock-movers/transfers/dead-stock/by-location), each mirroring that tab's real
  layout so navigation shows a matching skeleton with no shift.
- **Richer Overview** (owner: "make it a very rich inventory dashboard"). A second
  tile row (`inventory-snapshot-tiles.tsx`) under the four money-headline verdict tiles:
  **Stock value on hand**, **Units on hand** (both from the by-location totals, fetched
  in parallel on Overview only), **Low stock**, and **Units frozen** — so the landing
  view shows the whole inventory at a glance (worth, volume, at-risk, frozen), not just
  the four alerts. Overview skeleton updated to two tile rows.
- **By-Location dashboard** (`by-location-dashboard.tsx`): five company KPI tiles (stock
  value on hand, units, out-of-stock, low-stock, stocked locations) + a ranked
  per-location table with a value-share bar and out/low-stock cells — from backend
  SPEC-100. New service `getInventoryByLocationDashboard` + types.

## Tab labels

Reviewed for value; current labels already map to value (Reorder / Overstock & Movers /
Transfers / Dead Stock / By Location) so they're left unchanged pending the owner's pick
of any alternative — labels only, routes unaffected.

## Acceptance criteria

1. Each tab shows a skeleton matching its own content (no generic flash / shift).
2. Switching tabs fetches only that tab's slice; no tab loads transfers/dead-stock it
   doesn't show; dead-stock appears on exactly one tab.
3. By Location shows KPI tiles + ranked table (value, share, out/low-stock), or a clean
   empty/error state.
4. `tsc`, `lint`, full Vitest, `next build` green; both themes; no entrance animation.

## Manual verification (no jsdom runner)

- [ ] Click each tab → skeleton matches, then content; header/tab bar never blink.
- [ ] By Location shows per-store value/out-of-stock/low-stock + share bars.
- [ ] Overstock & Movers no longer shows the dead-stock list.
- [ ] Both themes; responsive.
