# SPEC-061 — Order Detail Page (drill-down from the orders list)

> **Revised after client clarification.** The first pass built a right-side Sheet
> overlay. The client's actual ask was a real sub-page — "a sub tab with breadcrumbs"
> showing the whole order, matching the pattern this app already uses for
> `/orders/review` (breadcrumb `Orders / <page>`, full-width content, its own URL).
> That's what this spec now describes; the Sheet component built in the first pass
> was deleted, not kept alongside it.

## Problem
The client asked to drill down from the orders list into a single order — as a real
page (bookmarkable, works with the browser back button, `Orders / #<name>` breadcrumb
at the top), not an overlay. Depends on backend SPEC-055 (`GET /orders/{order_id}`).

## Solution
- **New route `app/(app)/orders/[id]/page.tsx`** — Server Component, fetches via
  `getOrderDetail(id)` (new function in `services/orders.ts`, same `serverApi`
  pattern as every other list/detail fetch here). 404/other errors render the same
  breadcrumb shell with a plain error message, same pattern as `orders/review/page.tsx`
  handling a rejected `getOrdersReviewByLocation`.
- **Breadcrumb + title**, copied verbatim in structure from `orders/review/page.tsx`:
  `<nav aria-label="Breadcrumb">Orders <ChevronRight/> #<name></nav>`, then an `h1` +
  "Placed <date>" subtitle.
- **Full-width two-column layout** (`features/orders/order-detail-view.tsx`, pure
  presentational, server-renderable — no client JS needed): main column = line items
  (with current product thumbnail when available) + refunds (if any); sidebar =
  totals, discount codes (if any), customer snapshot (if any). Sections with nothing
  to show don't render — no empty boxes.
- **Row → page navigation, zero client JS.** `features/orders/orders-table.tsx` is a
  plain Server Component again (no `"use client"`, no fetch/open state). Each row uses
  the "stretched link" pattern: a real `<Link href="/orders/{id}">` in the order-number
  cell with `after:absolute after:inset-0`, against `position: relative` on the
  `<TableRow>` — the containing block for the pseudo-element resolves to the row (the
  cell itself is unpositioned), so the whole row is one accessible click target.
  Ctrl/cmd-click and "open in new tab" work natively because it's a real anchor, not a
  synthetic click handler; a screen reader announces one link per row, named by the
  visible order number. Trailing chevron column stays as the "this row goes somewhere"
  visual cue.

## Acceptance Criteria
- [x] Clicking a row navigates to `/orders/{id}` — a real page, not an overlay;
      breadcrumb `Orders / #<name>` at the top; browser back returns to the list
- [x] Ctrl/cmd-click (or middle-click) on a row opens the order in a new tab —
      verified live: new-tab navigation landed on the same page with the same
      breadcrumb
- [x] Page shows: status badges + channel/location, full line-item list (with
      product thumbnails when the product still exists), totals, discount codes (if
      any), customer snapshot (if any), refund history (if any) — sections with no
      data don't render
- [x] 404 and other fetch errors render the breadcrumb shell + a plain message,
      not a crash
- [x] `npm test` (221 passed), `npx tsc --noEmit` clean, `npm run lint` clean on
      touched files, `npm run build` green (confirms `/orders/[id]` route registered)
- [x] Manual check in a running browser against real store data: same-tab click,
      cmd-click new tab, and both themes all screenshotted live — correct layout,
      correct tokens/contrast, zero console errors

## Files
- `app/(app)/orders/[id]/page.tsx` (new)
- `features/orders/order-detail-view.tsx` (new, presentational)
- `features/orders/orders-table.tsx` (rewritten: server component, stretched-link rows)
- `services/orders.ts` (`getOrderDetail`)
- `types/orders.ts` / `lib/adapters.ts` — unchanged from the first pass (`OrderDetail`,
  `ApiOrderDetail`, `adaptOrderDetail`, still covered by their existing unit tests)
- Deleted: `features/orders/order-detail-sheet.tsx` (superseded)
