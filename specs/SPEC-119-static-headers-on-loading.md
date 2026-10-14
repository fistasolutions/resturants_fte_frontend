# SPEC-119 — Static page headers during loading (no header flash)

## Context / Why

The tab-shell pages (traffic, orders, products, inventory, …) keep a **static header**
on navigation because it lives in a `layout.tsx` that survives the `loading.tsx` swap.
The older top-level pages render their header inside `page.tsx`, and their `loading.tsx`
is a **headerless skeleton** — so on navigation the title vanishes into a skeleton until
data resolves ("the whole page starts loading"). Affected: **Dashboard, Morning Brief,
Customers, Reports, Results, Warehouse, Integrations, Chat**.

Several of these headers carry **data-dependent controls** (Reports' `HistoryMenu`,
Warehouse's location control, Brief's `DateRangePicker`), which can't move to a static
layout without detaching them from the title. So instead of restructuring every page
into a layout, the fix renders the **real header inside `loading.tsx`**: the static
title/description appear instantly and identically to the loaded page (no flash), while
data-dependent controls are shown as a small `Skeleton` in the `actions` slot and fill
in with the data. Only `loading.tsx` files change — zero risk to the pages themselves.

## Scope
For each affected route's `loading.tsx`:
- Render the page's real header — `<PageHeader title=… description=… />` for the five
  `PageHeader` pages (Customers/Reports/Results/Warehouse/Integrations), or the page's
  own inline header markup for Dashboard/Brief/Chat — using the **exact** title/description.
- Where the page header has a data-dependent control, pass a `Skeleton` as `actions`
  (or the inline equivalent) so the slot is reserved (no layout shift).
- Keep/adjust the content skeleton below so it mirrors the page's real structure
  ("skeleton as per the page").
- Match the page's outer wrapper (padding/`space-y`) so nothing shifts.

No `page.tsx` logic changes; no new `layout.tsx`. Titles are now duplicated between
`page.tsx` and `loading.tsx` — an accepted, low-cost trade for a header that never flashes.

## Tests / verification (Rule 4/7)
No pure logic added → existing Vitest suite + `tsc`/`lint`/`build` cover it. Manual:
navigate to each page → the **title/description are present immediately**, only the
content area skeletons, no flash; light + dark; build green.

## Acceptance Criteria
- [ ] All 8 pages show their real header instantly on navigation (no headerless skeleton).
- [ ] Each `loading.tsx` skeleton mirrors its page's layout.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.
