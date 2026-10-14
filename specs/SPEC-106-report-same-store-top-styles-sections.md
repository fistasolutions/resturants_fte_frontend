# SPEC-106 — Report sections: Same-Store Sales + Top-10 Styles (D-09, D-19)

## Context / Why

Backend SPEC-105 added two keys to the daily report payload: `top_styles` (sales-ranked
Top-10) and `same_store_sales` (comparable-store sales, this window vs the prior equal
window). This spec renders both on the `/reports` V2 view. Pure presentation of
backend-computed data (Rule 8); additive and guarded so older reports without the keys
render unchanged (Rule 7).

## Scope (`/reports`, `ReportV2View`)

- Extend `ReportMetrics` in `types/reports.ts` with `top_styles?` and `same_store_sales?`.
- **Top 10 Styles** — a `SectionCard` ("Top 10 styles · by revenue") listing rank +
  title + units + revenue (mirrors the existing "Top products" card).
- **Same-Store Sales** — a `Card` with a header line (comparable store count + total
  change vs prior period) and a per-location table (this period · prior period · change),
  change colored `text-success` / `text-destructive` / muted for null.
- Both blocks guarded on `metrics.x && …length > 0` so old reports are unaffected.
- These appear after the next report generation/regeneration (the payload is stored).

## Design compliance (Rule 9)

- Semantic tokens only (`text-success`, `text-destructive`, `text-muted-foreground`,
  `border-border`); no hex, no `text-*-500`.
- No Framer Motion, no entrance animations — sections render in final position.
- Reuses `SectionCard` / `SectionLabel` / `Card`; 8px spacing; responsive table in an
  `overflow-x-auto` wrapper.

## Tests (Rule 4)

`tests/reports-metrics.test.ts` — type-contract fixtures asserting the `top_styles`
(≤10, has product_id/title/units/revenue) and `same_store_sales` (locations + comparable
total, `change_pct` number|null) shapes compile and are read correctly. The `.tsx` view
change ships with the manual checklist below (no jsdom runner).

## Manual verification checklist

- [ ] `/reports` (after regeneration): "Top 10 styles" lists up to 10, revenue-ranked.
- [ ] "Same-store sales" shows only comparable stores, with correct this/prior/change.
- [ ] An old report (pre-regeneration) renders with neither section, no errors.
- [ ] Light + dark themes; mobile/tablet/desktop; no horizontal page scroll.

## Acceptance Criteria

- [ ] Both sections render from the report payload, guarded for old reports.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Patches
(none yet)
