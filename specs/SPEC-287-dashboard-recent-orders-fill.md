# SPEC-287 — Dashboard: Recent orders fills the main column

Status: implemented (2026-09-22)
Depends on: SPEC-233 (the compact two-column layout), SPEC-230 (client cache),
backend SPEC-008 (dashboard data API — `recent_orders`, Patches 2026-09-22)

## Problem

Owner, 2026-09-22, on the Dashboard at 1440px: "increase its height, add more there,
so that both sides are equal height and no space is left." The main column (chart ·
locations · recent orders) ends ~275px above the rail (net sales · what changed ·
channels · top products): Recent orders shows the backend's eight rows and stops,
and the grid is `items-start`, so the page's bottom-left is empty.

## The rule

**Presentation changes. Behaviour does not.** Every query, refetch policy, number,
link, status badge, empty state and error state of SPEC-233 survives. The one data
change is additive: the backend serves **20** recent orders instead of 8 (backend
SPEC-008 Patches); the panel decides how many are *visible*.

## Layout

- The two-column grid is `items-stretch` (was `items-start`), so both columns are as
  tall as the taller one. The main column is a flex column; Recent orders is its last
  child and **grows to the column's remaining height** (`lg:contain-size` — size
  containment gives the panel no intrinsic height, so it never *drives* the row; a
  bare `flex-basis: 0%` still counts the rows in Chrome's column-flex intrinsic
  sizing — then `lg:flex-1` grows it to fill) with a floor of 320px so a short rail
  never crushes it.
- Inside the panel, the table wrapper scrolls vertically (`overflow-y-auto`,
  `scrollbar-subtle` — the SPEC-286 custom scrollbar) with the column header sticky,
  so the rows the height cannot show are one wheel away, never clipped mid-row.
- Under `lg` the columns stack; the panel takes its natural height, capped at 480px
  with the same inner scroll, so twenty rows never dominate a phone.
- The header count reads "latest 20" (it always read the row count).
- `Panel` gains an optional `bodyClassName` so a panel can make its body a flex
  child; no other panel changes.
- The skeleton (`dashboard-skeleton.tsx`) keeps its shape; its recent-orders block
  also fills the column so the first paint matches.

## Acceptance

1. At 1440px with the live store, the bottom edge of Recent orders and the bottom edge
   of Top products are the same y (±2px); no empty band under the main column.
2. Recent orders shows as many rows as fit and scrolls for the rest; twenty rows are
   served (`recent_orders.length === 20` in the response).
3. Under 1024px the panel is at most 480px tall and scrolls.
4. Every SPEC-233 behaviour above unchanged; `npm test`, `tsc`, lint and build green.

## Manual verification (no jsdom runner)

- [ ] `/dashboard` at 1440×900, light and dark: columns end together.
- [ ] Wheel inside Recent orders scrolls the rows; the header stays.
- [ ] 400px wide: the panel is ≤ 480px and scrolls.
