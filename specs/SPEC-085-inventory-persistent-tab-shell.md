# SPEC-085 — Inventory Analyst Persistent Tab Shell

## Problem
On the Inventory Analyst page (tabs from SPEC-083: Overview, Reorder, Overstock
& Movers, Transfers, Dead Inventory, By Location) **switching tabs re-renders
the entire page, tab bar included.**

Root cause: every tab is a real route (SPEC-083), and each route renders one
async server component (`InventoryPageContent`) that does `await
getInventoryPanel(...)` at the top and only *then* renders header + tab bar +
content as a single unit. The lone loading state, `inventory/loading.tsx`, is a
**full-page** skeleton (header + tab-bar area + tiles + tables). So a tab click
tears down the whole page, shows the full-page skeleton (the tab bar blinks
out), waits for the new tab's data, and repaints everything. The tab bar
flickers on every switch instead of staying put.

## Solution
Move the persistent shell — **page header (title + date-range picker) and the
tab bar** — into a Next.js **layout** that wraps the inventory tab routes. A
layout does not unmount when navigating between its child routes, so the shell
stays painted and interactive; the active tab highlights instantly (client
`usePathname`), and only the content below swaps, showing a **content-only**
skeleton while that tab's data loads.

Owner decision (2026-08-03): the header (title + range picker) stays persistent
alongside the tab bar — only the tables/content below swap. Dead Inventory folds
into the shared shell (shared "Inventory Analyst" title, its own description, no
range picker — it has a fixed 7-day window); its former breadcrumb/separate
title is dropped and its summary strip now renders below the shared tabs.

### New files
- `lib/inventory-tabs.ts` — pure, unit-tested tab model + routing helpers:
  `INVENTORY_TABS`, `InventoryTabKey`, `activeInventoryTab(pathname)` (exact
  match — returns `null` on any nested/detail route),
  `isInventoryTabRoute(pathname)`, `inventoryTabHref(basePath, searchParams)`
  (carries the active `range`/`from`/`to`/`period` across a switch).
- `features/inventory/inventory-shell.tsx` — `"use client"`. Reads
  `usePathname`/`useSearchParams`. On a tab route renders `<main>` + `PageHeader`
  (title + `DateRangePicker`, hidden for Dead Inventory) + `InventoryTabs` +
  `{children}`. On any non-tab route (store-transfers, dead-inventory detail,
  markdown-plan) renders `{children}` bare, so those pages keep their own header.
- `app/(app)/inventory/layout.tsx` — server layout, renders
  `<InventoryShell>{children}</InventoryShell>`. This is what makes the shell
  persist across tab navigations.

### Changed files
- `features/inventory/inventory-tabs.tsx` → `"use client"`, self-sufficient
  (active from `usePathname`, range from `useSearchParams`); no more `active`/
  `range` props. Rendered only by the shell now.
- `features/inventory/inventory-page-content.tsx` — drops the header, range
  picker, tab bar, `TAB_META`/`basePath`, and its `<main>`; returns the tab body
  only (fragment). Range is still resolved here (default `30d`, unchanged) for
  the data fetch and query strings. The not-available fallback becomes a
  content-only card.
- `app/(app)/inventory/dead-inventory-alerts/page.tsx` — drops breadcrumb,
  title, description, tab bar, and `<main>`; returns the summary strip +
  `DeadInventoryReview` (or error card) only.
- `app/(app)/inventory/loading.tsx` — content-only skeleton (tiles + tables); no
  header/tab-bar/`<main>` (the shell provides those and stays painted).
- `app/(app)/inventory/dead-inventory-alerts/loading.tsx` — content-only
  (summary strip + table skeleton); no header/tab-bar/`<main>`.

### Known minor trade-off (documented, not a regression of behavior)
`store-transfers` and `markdown-plan` have no own `loading.tsx`, so their
Suspense fallback is `inventory/loading.tsx`. After this change that fallback is
main-less, so during their (sub-second) load the skeleton renders without the
page padding. These are ancillary, out-of-scope routes and their prior fallback
was already the wrong (inventory-shaped) skeleton; the loaded pages are
unaffected (they own their `<main>`). Left as-is to keep this change surgical.

## Acceptance Criteria
- [x] Switching between the six Inventory tabs keeps the tab bar (and header)
      painted — no full-page skeleton, no tab-bar flicker. **Done by
      construction** (shell now lives in the persistent `layout.tsx`, unmounted
      only when leaving `/inventory`); needs the manual browser confirmation below.
- [x] Only the content area swaps on a tab switch, showing a content-only
      skeleton until that tab's data resolves — `loading.tsx` files trimmed to
      content-only; the shell's `<main>` + header + tabs stay mounted.
- [x] Active tab highlights instantly on click (before data arrives);
      `aria-current="page"` on the active tab — tab bar reads `usePathname`.
- [x] A custom date range survives a tab switch (carried in the URL); the range
      picker is hidden on Dead Inventory — `inventoryTabHref` (unit-tested) +
      `hasRange` gate in `InventoryShell`.
- [x] `/inventory/dead-inventory-alerts` and `/inventory/markdown-plan` still
      work at their existing URLs; store-transfers detail pages unaffected —
      all routes compiled in `npm run build`; shell renders bare on non-tab routes.
- [x] `lib/inventory-tabs.ts` helpers unit-tested (`tests/inventory-tabs.test.ts`)
      — 11 tests pass.
- [x] `npm test` (258 passed), `npx tsc --noEmit` (exit 0), `npm run lint`
      (changed files clean; 3 pre-existing errors in untouched
      `markdown-plan-page.tsx`/`reorder-table.tsx`), `npm run build`
      (✓ Compiled successfully) all green.

## Manual verification (frontend has no jsdom runner — root Rule 4)
Run `npm run dev`, sign in, open `/inventory`, and in **both** light and dark
themes:
1. Click through all six tabs — the tab bar + "Inventory Analyst" header stay
   put, the active underline moves the instant you click, and only the area
   below shows a skeleton then fills in. No full-page flash.
2. Pick a custom date range on a range tab, switch tabs — the range persists;
   on Dead Inventory the range picker is absent.
3. Open a Dead Inventory row's detail page and a Store Transfers page — no tab
   bar there, those pages render their own header as before.

## Files
- `lib/inventory-tabs.ts` (new)
- `features/inventory/inventory-shell.tsx` (new)
- `app/(app)/inventory/layout.tsx` (new)
- `tests/inventory-tabs.test.ts` (new)
- `features/inventory/inventory-tabs.tsx` (rewrite → client, self-sufficient)
- `features/inventory/inventory-page-content.tsx` (content-only)
- `app/(app)/inventory/dead-inventory-alerts/page.tsx` (content-only)
- `app/(app)/inventory/loading.tsx` (content-only skeleton)
- `app/(app)/inventory/dead-inventory-alerts/loading.tsx` (content-only skeleton)
