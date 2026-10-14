# SPEC-026 — Product Analyst v2 (Verdicts, AI Panel, Chart, Catalog)

- **Status:** Implemented
- **Date:** 2026-07-16
- **Supersedes:** SPEC-023's eight-card grid layout (period switcher and the
  estimate-labeling rules carry over).
- **Backend:** SPEC-018 — `product_analysis` now carries `verdicts` +
  `catalog` (with real margins from synced COGS) and
  `GET /analysis/products/commentary` serves the cached AI verdict.
- **Owner reference design:** verdict tiles → AI on the page → category
  chart → one unified catalog table with status chips.

## Changes

1. **Verdict tiles** (`features/analysis/verdict-tiles.tsx`, server): Best
   Seller (title + revenue), Highest Margin (title + margin %, only if cost
   data exists — otherwise an honest "no cost data yet" tile), Highest
   Returns (title + rate, estimate-labeled), No Sales 60d+ (count,
   "candidates to liquidate").
2. **AI Analyst panel** (`features/analysis/ai-commentary.tsx`, client):
   fetches the cached commentary after render (numbers never block on the
   LLM), skeleton while loading, "✦ AI analysis · N min ago" stamp, refresh
   button forcing regeneration, stale/error states surfaced honestly.
3. **Revenue by category chart** (`features/analysis/category-chart.tsx`,
   client): Recharts bar chart through the shadcn `ChartContainer`, same
   token conventions as the dashboard's revenue chart.
4. **Unified catalog table** (`features/analysis/catalog-table.tsx`, server):
   Product · Category · Units · Revenue · Margin (— when no cost data) ·
   Disc. · Return (estimate) · Sell-thru (estimate) · Status chip
   (best seller / healthy / slow / dead stock — token tones). Estimate
   columns carry a footnote.
5. Page rebuild: tiles → AI panel → chart → catalog; period switcher kept;
   old section-card grid removed.

## Acceptance criteria

- [ ] Tiles, chart, and catalog render from the live aggregate; margin shows
      only where cost data exists.
- [ ] AI panel loads after page render, caches (timestamp visible), refresh
      regenerates; page numbers never wait on the LLM.
- [ ] Status chips match backend statuses; estimates footnoted.
- [ ] All four frontend gates green.
