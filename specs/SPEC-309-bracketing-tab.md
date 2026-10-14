# SPEC-309 — Returns Analytics → Bracketing

**Status:** implemented · **Date:** 2026-09-25 · **PBI:** 20. **Backend:** SPEC-306
(`GET /returns/bracketing?start=&end=`). **Builds on:** SPEC-230 (client cache), the Returns
Analytics tabs, SPEC-306 frontend Fit (a style's fit verdict links to its Fit page).

## What the owner gets

A sixth Returns Analytics tab, **Bracketing**, over the page's date range (orders placed in
the range; their refunds whenever they came):

1. **Tiles** — bracket orders (and their share of all orders), kept one size, returned
   everything, money refunded on bracket orders (and its share of all refunds).
2. **How brackets end** — one bar split kept all / kept one / kept some / returned all.
3. **By channel** — online, in store, other: bracket orders, kept one, refunded.
4. **Styles** — the styles that draw bracketing: orders holding the style, bracket orders,
   bracket rate, kept one, refunded, and the style's fit verdict (a link to its Fit page)
   where one exists. Sortable; 25 a page.
5. **Customers** — two lists behind a switch: *Repeat bracketers* (3+ bracket orders that
   ended in a return, returns from at least half of them) and *High-return customers* (5+
   orders, 50%+ of units refunded): name, orders, bracket orders and returns, return rate,
   refunded. The footnote says what the lists are — patterns, not verdicts — and that
   nothing is sent or flagged anywhere.

## Code

`types/bracketing.ts`, `lib/bracketing-api.ts` (adapters), `lib/bracketing.ts` (pure:
outcome split, channel labels, sort, paging, rate text), `returnQueries.bracketing` in
`lib/queries/returns.ts`, `features/returns/bracketing-tab.tsx`; the tab in
`features/returns/returns-tabs.tsx`, the page's `TAB_IDS` and prefetch, and the content
switch. Returns Analytics doc gains the section (Rule 11).

## Acceptance criteria

1. The tab renders the live figures for the range; switching tabs and back reads the cache.
2. Styles sort and page without a request; a fit verdict links to `/products/fit/<id>`.
3. The customer switch shows each list; empty lists say so plainly.
4. Skeleton while loading, recoverable error, empty state; 390 px without page scroll;
   light and dark.
5. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Verification

Run 2026-09-25 on the **real store** (backend :8102, production build :3102), last 90 days.

1. **done.** 2,433 bracket orders (5.8% of 42,051), 989 kept one, 586 returned everything,
   $219.2K refunded on brackets (13.5% of refunds). Tab click → data 1.9 s; revisit 60 ms.
2. **done.** Sort 200 ms and the customer switch 182 ms with **no requests**; styles page at
   25 (2 pages of 50); 14 fit verdicts link to their Fit pages.
3. **done.** Both lists render; an empty list says "No customer matches this pattern".
4. **done.** Skeleton, `QueryErrorState` (it reads Shopify, not Loop — own error), empty
   state; hydration guard; 390 px `scrollWidth` 390; light and dark; no page errors.
   **Found and fixed:** the Returns shell kept its own tab list without "fixes", so Product
   Fixes (since it shipped) and Bracketing showed "Overview" highlighted — now one list in
   `lib/returns-tabs.ts` for the page and the shell (tested; checked live).
5. **done.** `npm run lint` 0 errors, `npx tsc --noEmit` clean, `npm test` 178 files / 2,021
   tests, `npm run build` compiled. Returns Analytics doc gains the section (`updated` 2026-09-25).
