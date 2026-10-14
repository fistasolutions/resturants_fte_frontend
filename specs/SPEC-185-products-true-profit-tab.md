# SPEC-185 — Products → True Profit tab

Status: implemented
Depends on: backend SPEC-204 (True Profit per SKU), SPEC-090 (product tab shell)

## Problem

Idea #1 of the 23-item set. Every product surface in the app ranks by **revenue** — the
number that makes a loss-making style look like a winner because it is measured before
the cost of the goods, the discount that moved them, and the refunds that came back.

Measured on production over 30 days: **545 products are loss-making, costing $138,065**,
and one of them — `PANELED SKIRT SS26` — is currently displayed as a location's "TOP
PRODUCT" on the dashboard while losing $2,259.

## Design

A fourth tab on the existing Product Analyst shell: **Overview · Catalog · Return Leak ·
True Profit**. No new route group, no new shell — `PRODUCT_TABS` gains an entry and
`/products/true-profit` a page, so the persistent header, tab bar and date range all work
unchanged.

**Summary tiles** carry the store-wide waterfall so the tab reconciles against the
dashboard: gross revenue → discounts → COGS → returns → true profit, plus a count of
loss-makers and their total.

**The table** is the page. Worst true profit first, because the losses are why it exists.
Columns: product, units, gross revenue, discounts, COGS, returns, true profit, margin %,
verdict. Deductions render in `text-destructive`; true profit is the emphasised column and
switches colour on sign.

**The `No cost data` verdict is not decoration.** 777 products have no variant cost, and
without COGS their "profit" is revenue wearing a different label. Those rows render muted
with an em-dash in place of a margin, and the tile row states how many are excluded —
otherwise the page would quietly present them as the most profitable products in the
catalogue.

Nothing is computed in the browser (root Rule 8); the adapter maps backend fields to view
models and the component formats.

## Acceptance Criteria

- [x] `/products/true-profit` renders inside the existing product shell with the tab
      bar showing four tabs and True Profit active.
- [x] Date range carries across tab switches like every other product tab.
- [x] Summary tiles show the waterfall and the loss-maker count.
- [x] Table sorted worst-first; deductions destructive-toned; profit coloured by sign.
- [x] `No cost data` rows are visually muted and show no margin figure.
- [x] Empty state when the window has no products.
- [x] Tokens only, no hardcoded colours; no entrance animation (Rule 9).
- [x] `npm test` green (tab-model + adapter units); `tsc --noEmit` clean; `build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Tab bar shows four tabs; True Profit underlines when active.
- [ ] Worst product at the top has a negative, red true profit.
- [ ] `No cost data` rows show "—" for margin and are muted.
- [ ] Summary tiles reconcile with the dashboard's net-sales card for the same range.
- [ ] Light and dark themes both legible.

## Patches

### 2026-09-17 — header alignment (quick fix)

The Product / Verdict column headers rendered right-aligned over left-aligned cells. `` `${HEAD} text-left` `` never won because Tailwind resolves a `text-left`/`text-right` conflict by stylesheet order, not by the order the classes appear in the string. `true-profit-view.tsx` now splits the base into `HEAD_BASE` with `HEAD` (right) and `HEAD_LEFT` (left) — the same pattern the Cash Release and Allocation tables already use.
