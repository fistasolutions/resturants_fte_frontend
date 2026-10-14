# SPEC-160 — Product detail: "Sold per location" box

**Status:** implemented
**Date:** 2026-08-24
**Amends:** SPEC-146 (product-analyst detail page)
**Backend counterpart:** backend `SPEC-162-product-sales-by-location`

## 1. Request

Client feedback, verbatim, on the Product Analyst detail page:

> "Can you put in another box of how many sold per location"

The page shows a 2×2 grid of tiles — Revenue, Units sold, In stock ("all
locations"), Variants. Stock is already location-aware in spirit; units sold is
a single blended number, so he cannot see that a style is moving in one store
and dead in another.

## 2. Design

### 2.1 Why not a fifth StatTile

A `StatTile` renders one number. The ask is inherently a *breakdown* — the real
store has three selling locations plus a large online/unattributed bucket, so a
single tile cannot answer "per location". Instead the grid keeps its four tiles
and gains a **full-width box beneath them** (`col-span-2`), built from the same
`Card` primitive so it reads as one more box in the same group rather than a
new section.

### 2.2 Contents

One row per location, units-descending, each showing:

- location name (`Online / unattributed` for the NULL bucket, already labelled
  by the backend — the frontend never re-derives it),
- units sold, prominent and `tabular-nums`,
- revenue, muted,
- a proportional share bar (share of this product's units), so relative
  performance is readable at a glance without doing arithmetic.

The bar is a plain `div` width percentage — **no entrance animation**, no
staggered reveal (root Rule 9). It renders in its final position.

### 2.3 States

- **Empty** (`sales_by_location: []`): the box renders with "No sales in this
  period" rather than disappearing, so the layout does not jump between
  products and the merchant can tell "zero" from "not loaded".
- **Single location**: still renders — a 100% bar is a legitimate answer.

### 2.4 Tokens & a11y

Semantic tokens only (`bg-card`, `text-muted-foreground`, `bg-primary/15`,
`border-border`) — no hardcoded colors, verified in light and dark. The share
bar is decorative (`aria-hidden`); the numbers beside it carry the meaning, and
the list is a real `<ul>`/`<li>` so it is readable in sequence by a screen
reader.

## 3. Acceptance criteria

1. A "Sold per location" box appears under the existing four tiles on
   `/products/{productId}`. ✅
2. One row per location, units-descending, with units and revenue. ✅
3. The NULL bucket shows the backend's `Online / unattributed` label. ✅
4. Share bars are proportional to units and use `--primary`, never `--brand`. ✅
5. Empty list renders an explicit empty state, not a missing box. ✅
6. Semantic tokens only; no entrance animation. ✅
7. `ProductDetail` type extended additively. ✅
8. `npm test` green and `npm run build` compiles every route. ✅

## 4. Manual verification checklist

No jsdom/component runner exists (root Rule 4), so UI is verified by hand:

- [ ] `/products/catalog` → open any product with sales in the window.
- [ ] Box lists locations, biggest first; units sum to the "Units sold" tile.
- [ ] Toggle dark mode — bars and text stay legible, no hardcoded color.
- [ ] Narrow to mobile width — box stays full-width, no horizontal page scroll.
- [ ] Open a product with no sales in the window → empty state, box still present.
