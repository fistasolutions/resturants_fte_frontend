# SPEC-211 — Inventory → Buy Plan tab

Status: implemented
Depends on: backend SPEC-210 (size-curve buy plan), SPEC-085 (inventory tabs)

## Problem

Idea #2 of the 23-item set. `/inventory/reorder` ranks what to reorder as a **unit
total**. The buy is made per size, so the split falls back to the supplier's standard
pack and the season ends sold out in the middle and marked down at the ends.

Production, 90 days at a 6-week cover target: **1,261 styles under cover, 24,151 units
suggested, $4.98M of revenue at risk.**

## Design

A seventh tab on the existing inventory shell. Per style: cover, units to buy, and the
size split as a row of size chips — the shape a buy sheet is actually written in, not a
table cell.

**Constrained sizes are shaded, not adjusted.** A size that sold out shows *low* demand in
a units-sold share, which is the error this feature exists to correct. Those chips take the
`warning` tint with a line saying real demand is higher than the split shows. The plan does
not silently inflate them — a model quietly rewriting a buy sheet is not something a buyer
asked for, and they are the ones who know whether it sold out in week 2 or week 9.

Each style states its `splitBasis` — which category curve was used and how many sizes it
was narrowed to — so a number can be traced without leaving the page. The category curves
render at the bottom for reference.

Default range is **90 days**, not the app-wide 30: a size curve needs more signal than a
fortnight.

## Acceptance Criteria

- [x] `/inventory/buy-plan` renders as a seventh tab in the existing shell.
- [x] Per style: cover, suggested units, and a per-size chip row.
- [x] Chips for sold-out sizes are visually distinct and explained.
- [x] The split basis names the category and size count.
- [x] Category curves listed for reference.
- [x] Default range 90 days; the picker still overrides it.
- [x] Empty state when nothing is below cover.
- [x] Tokens only; no entrance animation (Rule 9).
- [x] `npm test` green; `tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Seven tabs; Buy Plan active on its route.
- [ ] A numerically-sized style shows only numeric size chips.
- [ ] Chip units visibly sum to the style's suggested total.
- [ ] Light and dark themes both legible.
