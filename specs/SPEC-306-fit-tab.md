# SPEC-306 — Products → Fit: which way each style fits, and its size guide

**Status:** implemented · **Date:** 2026-09-25 · **Owner request:** "Fit engine and size
guides — do it end to end." · **PBIs:** 15 and 16. **Backend:** SPEC-303
(`GET /fit/overview`, `GET /fit/styles/{product_id}`).
**Builds on:** SPEC-090 (the Product Analyst shell and tabs), SPEC-230 (client cache),
SPEC-232 (persistent shell), SPEC-301's `ShallowLink` (URL state without a server render).

## What the owner gets

A **Fit** tab in the Product Analyst, after Return Leak:

1. **The picture** — four tiles: the share of returns that are about fit, the money
   refunded on them, styles running small, styles running large; one line saying what the
   verdicts rest on ("2,957 returns since 21 May 2026") and the rule ("a verdict needs at
   least 5 fit returns"). The tab reads the whole return history, so the shell's date
   picker is not shown on it.
2. **Vendors** — each label's pooled lean (vendor names are normalised by the backend),
   with how many of its styles run small or large; a vendor name narrows the styles below.
3. **Styles** — every style with a return: image, title, vendor, a small-vs-large lean
   bar, the verdict and its confidence, fit returns and fit rate, fit refunds. Verdict
   chips with counts (default "Has a verdict"), a vendor filter, a debounced search,
   sortable columns, 25 a page. The view lives in the URL (`ShallowLink` — no server render).
4. **A style's own page** — `/products/fit/[productId]`, with the breadcrumb Product
   Analyst › Fit › style: the verdict card with its headline and evidence, the generated
   size guide with **Copy guide** (plain text for the product page — nothing is written to
   Shopify), the per-size table (sold, too small, too big, fit rate, advice), which way
   exchanges moved, and the vendor's profile. Unknown style → the backend's 404 as a
   recoverable error state.

## Code

- `types/fit.ts`, `lib/fit-api.ts` (adapters), `lib/fit.ts` (pure: verdict labels and
  tones, filters, sort, paging, lean split, the copy text, hrefs), `lib/queries/fit.ts`
  (registry `fitPaths` / `fitQueries`, pinned in `tests/query-registries.test.ts`).
- `features/fit/` — `fit-view.tsx`, `fit-style-view.tsx`, `fit-ui.tsx`, `fit-skeleton.tsx`.
- Routes `app/(app)/products/fit/{page,loading}.tsx` and
  `app/(app)/products/fit/[productId]/{page,loading}.tsx`; `lib/product-tabs.ts` gains the
  tab; `ProductShell` omits the date picker on it.
- In-app docs: the Product Analyst doc gains a Fit section (Rule 11).

## Acceptance criteria

1. The Fit tab renders the tiles, vendors and styles from the live backend; the header
   stays mounted and the picker is absent on this tab only.
2. Verdict chips, vendor filter, search, sort and paging change the URL without a server
   render and survive back/forward; 25 rows a page.
3. A style page shows its guide, per-size table and exchange evidence; Copy guide puts the
   plain-text guide on the clipboard; a style with no returns shows the 404 message.
4. Shaped skeletons on both routes; recoverable error states; no horizontal scroll at
   390 px; tokens only, verified light and dark.
5. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Verification

Run 2026-09-25 against the **real store** (backend :8102 on the production database,
production build :3102), captured light, dark and 390 px.

1. **done.** Tiles on live data: 69.5% of returns about fit (2,054 of 2,957 since 21 May
   2026), $155.5K refunded on fit, 47 styles run small, 38 run large, 38 fit varies; 17
   vendors; 128 styles with a verdict. The picker is absent on Fit only (`RANGELESS_PRODUCT_TABS`).
2. **done.** Real clicks: verdict chip 62–69 ms and sort 125–141 ms with **no requests**
   (thumbnails aside); two Back presses restore the plain view; paging at 25 (6 pages of
   128). Fit tab first open from another product tab: 1.4 s (its one read through the proxy;
   `/auth/me` alone is 1.0 s from this laptop).
3. **done.** A style page opened by click in 1.3 s, back to Fit via the breadcrumb in 51–58 ms;
   Copy guide put the real guide on the clipboard ("Mini Pleat Yoke Dress - Black — Runs small
   — order one size up …"); an unknown style shows "No returns on record for that style yet,
   so its fit can't be read." with a link back. A row's read starts on hover.
4. **done.** Shaped skeletons on both routes; `scrollWidth` 390 at 390 px on both pages;
   tokens only; light and dark captured. **Found and fixed while verifying:** React #418 on
   2 of 5 loads of the Fit pages — the cached answer arrived between the server's skeleton
   and hydration. `hooks/use-hydrated.ts` keeps the first client render equal to the
   server's; after the fix 0 of 8 loads on each page.
5. **done.** `npm run lint` 0 errors (3 pre-existing Spotlight `<img>` warnings),
   `npx tsc --noEmit` clean, `npm test` 175 files / 1,997 tests passed, `npm run build`
   compiled with `/products/fit` and `/products/fit/[productId]`. Product Analyst doc gains
   the Fit section (`updated` 2026-09-25).
