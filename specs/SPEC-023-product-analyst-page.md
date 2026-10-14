# SPEC-023 — Product Analyst Page

- **Status:** Implemented
- **Date:** 2026-07-16
- **Backend:** `GET /analysis/products?period=` (SPEC-015 aggregate).
- **Value orientation (owner decision):** winners, losers, and money leaks —
  ranked verdicts, not a product list. Facts and estimates are visually
  separated (client rule: "separate facts from assumptions").

## Changes

1. Nav: "Products" item (`/products`, Package icon).
2. `services/analysis.ts` — `getProductAnalysis(period)`;
   `types/analysis.ts` mirrors the API aggregate.
3. `app/(app)/products/page.tsx` (RSC) — `?period=7d|30d|90d` (default 30d)
   via link-based switcher. Sections, each a card with a compact table:
   - **Best Sellers** (revenue desc) · **Worst Sellers** (lowest revenue that
     still sold, with remaining stock) · **No Sales** (count headline + top
     by stock value) — all facts.
   - **High Returns** — flagged `Estimate` with the backend's `basis` string
     (order-level attribution).
   - **Heavy Discounting** (line-level → fact) · **Sell-Through** — flagged
     `Estimate` with basis.
   - **Categories** — top & bottom by revenue (product_type based).
4. Shared primitives in `features/analysis/`: `section-card.tsx` (title,
   optional Fact/Estimate badge + basis tooltip text, children) and
   `simple-table.tsx` (token-styled compact table, no client JS).
5. Empty states per section ("No products matched in this period").

## Acceptance criteria

- [x] All seven sections render from the live aggregate; period switcher works.
- [x] Returns and Sell-Through visibly labeled as estimates with the basis.
- [x] All four frontend gates green.
