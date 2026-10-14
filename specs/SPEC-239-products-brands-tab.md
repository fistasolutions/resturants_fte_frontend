# SPEC-239 — Products → Brands: buy more, buy less, stop — per vendor

**Date:** 2026-09-14 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-246-brand-verdicts.md` (`GET /analysis/brand-verdicts`)
Depends on: SPEC-090 (product tab model), SPEC-185 (True Profit tab — the view this
mirrors), SPEC-230 (client data cache), SPEC-232 (persistent shells)

## Problem (HCI)

The buyer's question before a season is "which brands do I buy more of, which less,
which do I drop?" — and today the answer is spread over four pages (reports for
revenue, Profit Lens for margin, Return Leak per product, Inventory for dead stock),
none of them grouped by brand. This tab is that answer: one row per brand, four
numbers, one verdict, one sentence saying why.

## What this builds

A seventh tab on the Product Analyst page — **Brands**, `/products/brands` — inside
the persistent product shell, carrying the shell's date range like every other tab.

```
[ 146 brands ] [ 12 stop ] [ 43 buy less ] [ 3 buy more ] [ 33 hold ] [ 55 too few sales ]

Brand            Verdict       Why                                   Units   Revenue   Returns  Sell-thr  Dead $   Margin
STELLA & ROSE    ● Stop buying 25% of units come back with $6,333…   3,049  $353,949  25%      46%      $6,333   65% (95% costed)
MELI             ● Buy less    Sell-through 41% — over-bought, $478k… 63,890 $2.7M    12%      41%      $478,376 67% (88% costed)
…
```

- **Summary strip**: total brands, then one tile per verdict with its count. Tiles
  are the same `Card` tiles True Profit uses.
- **Table, one row per brand, backend order** (stop → buy less → buy more → hold →
  too few sales, revenue-desc within). Verdict is a badge with the backend's tone
  (`bad` / `warn` / `good` / `neutral` / `muted`); `why` is shown beside it — the
  reasoning is the product, not the badge.
- **Margin shows its coverage**: "65 %" over a muted "95 % costed" sub-line; a brand
  with no cost data shows "No cost data" in muted, never a number. A brand under the coverage floor
  still shows its margin — the backend simply did not let it trip the verdict.
- **Returns column** is the *all-channel* rate (Shopify refunds, counter included);
  a one-line note under the strip says so and points to Return Leak for reasons.
- **Range**: the shell's picker owns it — same `30d` default as every product tab.
  (The first cut defaulted this page to 90 days; the capture showed 90-day figures
  under the shell's "Last 30 days" header, so the page follows the shell and the doc
  tells the buyer to pick 90 days.)
- Empty state (no brand sold anything): "No brand sold anything in this period —
  widen the date range."; error state is the shared `QueryErrorState`.

## Design (root Rule 9)

Same tokens and table classes as `true-profit-view.tsx`; verdict badge colours from
`bg-destructive/10 text-destructive`, `bg-warning/10 text-warning`,
`bg-success/10 text-success`, `bg-muted text-muted-foreground`. Table scrolls
horizontally inside its card at narrow widths; no entrance animation.

## Scope

- `types/analysis.ts` — `ApiBrandVerdicts`, `BrandVerdictsData`, `BrandRow`.
- `lib/adapters.ts` — `adaptBrandVerdicts`.
- `lib/queries/analysis.ts` — `analysisPaths.brandVerdicts`, `analysisQueries.brandVerdicts(q)`.
- `lib/product-tabs.ts` — `{ key: "brands", label: "Brands", basePath: "/products/brands" }`
  as the seventh tab.
- `lib/brand-verdicts.ts` — pure: verdict badge class by tone, summary tiles, the
  margin cell text. Vitest-covered.
- `features/products/brand-verdicts-view.tsx` — the view;
  `features/products/product-analysis-tabs.tsx` — `BrandsTab`.
- `app/(app)/products/brands/page.tsx` — prefetches the query (SPEC-230).
- `tests/brand-verdicts.test.ts`; `tests/product-tabs.test.ts` (seventh tab);
  `tests/query-registries.test.ts` pins the query.
- `lib/docs/content/products.ts` — a "Brands" section; `updated` bumped.

## Not changed

Every other product tab, the shell, and the range picker.

## Acceptance criteria

1. `/products/brands` renders the strip and the table with the backend's order,
   badge tones and `why`; the margin cell shows coverage; no-cost brands read "No cost
   data".
2. The tab is active on its exact route only and carries the range across a switch.
3. `npm test`, `npx tsc --noEmit`, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

Done 2026-09-14 against the live store (Playwright capture, `?range=90d`):

- [x] `/products/brands`: tiles 146 / 11 stop / 41 buy less / 4 buy more / 35 hold /
      55 too few sales equal the API summary for the same window; first rows are the
      `stop` brands (STELLA & ROSE 25.3% returns, SONMER −0.8% margin on 84.5%
      costed, …); `why` reads as a sentence; margin shows its coverage.
- [x] First capture showed 90-day figures under a "Last 30 days" header (page-level
      default) — page now follows the shell; label and figures agree.
- [x] Margin cell wrapped ("65% (94.9% costed)") — coverage moved to a sub-line.
- [x] `npm test` 1499 passed, `tsc` clean, `npm run build` green with `/products/brands`.
- [ ] Both themes; 400 px: table scrolls inside its card, page does not — same
      table classes as True Profit, not captured today.
