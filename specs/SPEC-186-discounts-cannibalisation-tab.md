# SPEC-186 — Discounts → Cannibalisation tab

Status: implemented
Depends on: backend SPEC-205 (cannibalisation), SPEC-098 (discount workspace shell)

## Problem

Idea #8 of the 23-item set, and the largest lever in it on measured data. Production,
trailing 30 days: **$575,833 of discount, of which $439,040 (76.2%) went to customers who
had already bought**, against **65 new customers** across 112 codes.

The existing Discounts workspace shows how much was discounted, by whom and why. It
cannot show whether the discount bought anything.

## Design

A fifth tab on the existing workspace: Overview · Needs attention · Staff · Reasons ·
**Cannibalisation**. `DISCOUNT_TABS` gains an entry and `/discounts/cannibalisation` a
page, so the shell, range picker and header work unchanged.

Four summary tiles — discount given, to existing customers (with its share), new
customers won, and how many codes acquired nobody — then a table ranked by cannibalised
spend: code, orders, discount given, to existing, existing share, new customers, cost per
new customer, finding.

**The "Finding" column is deliberately not an instruction.** The largest codes by
cannibalised spend on production are operational credits staff apply by hand — `CUSTOM
DISCOUNT` ($171,224, zero new customers), `ALL DAMAGED`, `REPLACEMENT`, `LOOP-DISCOUNT`.
Those are existing-customer by nature, and a column telling the owner to "Retire" a
damaged-goods credit would be wrong. The page reports what the money did.

`cost_per_new_customer` renders as an em-dash rather than `$0` when a code acquired
nobody — zero would read as "free", which is the opposite of the truth. Guest orders are
labelled under the code as not attributable rather than being assumed new.

## Acceptance Criteria

- [x] `/discounts/cannibalisation` renders in the existing shell as a fifth tab.
- [x] Tiles show given, to-existing (+ share), new customers, codes acquiring nobody.
- [x] Table ranked by cannibalised spend, descending.
- [x] Cost per new customer shows "—", never `$0`, when nobody was acquired.
- [x] Guest orders surfaced as not attributable.
- [x] Findings are descriptive, not instructions.
- [x] Empty state when no codes were used; API error handled like sibling tabs.
- [x] Tokens only; no entrance animation (Rule 9).
- [x] `npm test` green; `tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Five tabs; Cannibalisation underlines when active and carries the range.
- [ ] Top row is the largest cannibalised spend.
- [ ] A zero-acquisition code shows "—" under Cost / new.
- [ ] Light and dark themes both legible.

## Patches

### 2026-09-17 — header alignment (quick fix)

The Code / Finding column headers rendered right-aligned over left-aligned cells. `` `${HEAD} text-left` `` never won because Tailwind resolves a `text-left`/`text-right` conflict by stylesheet order, not by the order the classes appear in the string. `cannibalisation-table.tsx` now splits the base into `HEAD_BASE` with `HEAD` (right) and `HEAD_LEFT` (left) — the same pattern the Cash Release and Allocation tables already use.
