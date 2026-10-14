# SPEC-258 — Analysis table controls: search, facet filter, pagination (in place)

**Status:** implemented · **Date:** 2026-09-17 · **Repo:** frontend · **Depends on:** SPEC-230 (client data cache), SPEC-105 (`lib/catalog-pagination.ts`), SPEC-253 (the `/ci` filter bar this copies)

## Why

Six analysis tables render every row the backend returns — 50 to 200 of them — as one
long list with no way to narrow it or page it: Products → True Profit (SPEC-185),
Products → Content Gaps (SPEC-213), Discounts → Cannibalisation (SPEC-186), Foresight →
Launch Watch (SPEC-192), Inventory → Data Trust (SPEC-217) and Returns → Fixes
(SPEC-187). The owner asked for proper filtering and pagination on all six, with one
hard constraint: **moving between pages must re-render the table alone, never the
page.**

## What

One shared, pure control model and two shared presentational pieces, applied to all six
tables:

- `lib/table-controls.ts` — the logic, unit-tested:
  - `matchesQuery(fields, query)` — every whitespace-separated token of the query
    appears (case-insensitive) in at least one of the row's searchable fields.
  - `facetOptions(rows, facetOf)` — the distinct facet labels with counts, by count
    descending then label, for the chip row.
  - `applyControls(rows, controls, spec)` — filter by query and facet, clamp the page
    into range, return the page slice plus `matches`, `total`, `page`, `pages`.
  - `TABLE_PAGE_SIZE = 15`; `pageWindow(page, pages)` picks which page numbers to show
    (first, last, the current ±1, `…` for gaps) so a 14-page table still fits one row.
  - Reuses `pageCount` / `paginate` / `clampPage` from `lib/catalog-pagination.ts`.
- `hooks/use-table-controls.ts` — `useTableControls(rows, spec)` keeps `query`,
  `facet` and `page` in **component state**. Changing the query or facet resets the
  page to 1; the page clamps itself when the row set shrinks.
- `components/shared/table-toolbar.tsx` — the search input, the facet chips
  (`All` + one per label, each with its count, `aria-pressed`), the match count and a
  `Clear` button when anything is active. Same visual language as the `/ci` filter bar.
- `components/shared/table-pager.tsx` — `Prev` · windowed page numbers · `Next` with
  "Page x of y · n <noun>"; renders nothing when there is one page.
- `components/shared/table-empty-row.tsx` — the "No <noun> match" row with a Clear
  button, inside the table so the header stays put.

Each of the six views gains a `<XTable>` component that owns the controls and renders
the toolbar, the table and the pager; the view's summary tiles, callouts and footnotes
stay outside it. Per table:

| Table | Search fields | Facet | Noun |
| --- | --- | --- | --- |
| True Profit | title, category | verdict (Losing money · No cost data · …) | products |
| Content Gaps | title, category | gap (Single image · Thin gallery · No image) | products |
| Cannibalisation | code | finding (Not acquiring · Mostly existing · Mixed · …) | codes |
| Launch Watch | title, category | verdict | styles |
| Data Trust | label, explanation, affects | status (`ruleStatusLabel`) | checks |
| Returns → Fixes | title, top reason | fix (Size chart + fit note · Re-shoot / add images · …) | products |

Facets are **data-driven** — the chips are whatever labels the rows actually carry, so
a new backend verdict appears as a chip with no frontend change, and a label with no
rows never shows.

## Why in place, not in the URL

All six endpoints already return their whole, bounded list (`limit` ≤ 500) into the
client cache (SPEC-230). Filtering and paging that list in memory is the fastest
possible implementation — no round trip, no skeleton — and keeping the controls in
component state is what satisfies the owner's constraint: a `router.replace` with a
`?page=` would soft-navigate the route, re-run the `force-dynamic` Server Component and
re-render the page. State in the table component re-renders the table component. The
summary tiles are siblings of it and do not render again.

Consequence, stated: a page/filter is not shareable in the URL and resets on tab or
range change. That is the right trade for an in-place control on a fully loaded list;
the `/ci` feed keeps its URL filters because its reports are meant to be linked.

## Out of scope

Column sorting; server-side pagination (the lists are bounded and already loaded);
persisting the controls; the other tables that already page (catalog, customers,
conversations) — they keep their own controls.

## Files

- New: `lib/table-controls.ts`, `hooks/use-table-controls.ts`,
  `components/shared/table-toolbar.tsx`, `components/shared/table-pager.tsx`,
  `components/shared/table-empty-row.tsx`, `tests/table-controls.test.ts`.
- Changed: `features/products/true-profit-view.tsx`,
  `features/products/content-gaps-view.tsx`,
  `features/discounts/cannibalisation-table.tsx`,
  `features/foresight/launch-watch-view.tsx`, `features/inventory/data-trust-view.tsx`,
  `features/returns/fixes-tab.tsx`.
- Docs (Rule 11): the six tabs' `sections` prose in `lib/docs/content/{products,
  discounts,foresight,inventory,returns}.ts` say the table searches, filters and pages;
  `updated` bumped.

## Acceptance criteria

- [x] `tests/table-controls.test.ts` covers: token search across fields, facet counts
  and order, facet + query combined, page clamp after the set shrinks, `pageWindow`
  shapes (≤7 pages all shown; 14 pages → `1 … 6 7 8 … 14`), empty result.
- [x] All six tables show the toolbar; each facet chip carries its count; `All` is the
  default; the pager appears only past 15 rows.
- [x] Typing narrows the rows instantly; the page resets to 1; the match count reads
  "n of N <noun>".
- [x] Paging performs **zero network requests** and no navigation (measured with
  Playwright: request count during a page click = 0, DOM updated in < 50 ms) — the
  page's summary tiles are untouched.
- [x] Empty result shows the in-table "No <noun> match" row with Clear.
- [x] Keyboard: chips and pager buttons focusable with a visible ring; the search input
  is labelled.
- [x] Tokens only; no entrance animation (Rule 9). `npm test`, `tsc --noEmit`,
  `npm run build` green.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] True Profit: "Losing money" chip → only losing rows; search "skirt" → matching
  titles; page 2 → rows 16–30; tiles above do not flicker.
- [ ] Cannibalisation: "Not acquiring" chip count equals the "Acquiring nobody" tile.
- [ ] Content Gaps: "No image" chip count equals the summary's `byGap` figure.
- [ ] Data Trust: one page (few checks) → no pager; search still narrows.
- [ ] Light and dark themes both legible.
