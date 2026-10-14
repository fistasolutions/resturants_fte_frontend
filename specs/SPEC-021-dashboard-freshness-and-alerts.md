# SPEC-021 — Dashboard Freshness & Alert Accuracy

- **Status:** Implemented
- **Date:** 2026-07-16
- **Context:** Live QA (2026-07-16). (1) The dashboard renders at page load
  and never refreshes — users watching the tab see frozen numbers and assume
  sync is broken (backend syncs every 15 min; the screen just never re-asks).
  (2) The stock alert cards counted from the capped 20-row alert list and
  skipped oversold variants: `available > 0` (low) / `=== 0` (out) counts a
  variant at −476 stock **nowhere**. (3) The "vs yesterday" KPI label now
  means "vs yesterday same time" (backend SPEC-014 §4) and should say so.
- **Backend counterpart:** backend SPEC-014 (additive `inventory_counts`
  field; same-time comparison).

## Changes

1. **Auto-refresh** — new client component
   `features/dashboard/auto-refresh.tsx`: calls `router.refresh()` every 60 s
   while the tab is visible (listens to `visibilitychange`; hidden tabs don't
   poll, and re-showing the tab refreshes immediately). Mounted once on the
   dashboard page; renders nothing. CSS-free, no entrance animation concerns.
2. **Alert counts** — `adaptAlerts` prefers the backend's new
   `inventory_counts` (true store-wide counts): `outOfStockVariants =
   out_of_stock` (available ≤ 0, oversold included), `lowStockVariants =
   low_stock`. Falls back to counting the alert list (with `<= 0` for out of
   stock) when the field is absent, so the UI tolerates an older backend.
3. **Comparison label** — `COMPARISON_OPTIONS.previous_day.shortLabel`
   becomes `"vs yesterday (same time)"`.

## Tests

- `adaptAlerts`: uses `inventory_counts` when present; fallback counts
  negatives as out-of-stock; refund fields pass through.
- Existing suites stay green: `npm test`, `npx tsc --noEmit`, `npm run lint`,
  `npm run build`.

## Manual verification checklist

- [ ] Dashboard numbers change without a manual reload within ~60 s of new
      backend data.
- [ ] Background tab does not poll (network idle); foregrounding refreshes.
- [ ] Stock cards show non-zero counts matching the DB (oversold included).
- [ ] KPI cards read "vs yesterday (same time)" for the Today period.

## Acceptance criteria

- [x] Auto-refresh works, visibility-aware, no visual side effects.
- [x] Oversold variants appear in Out of Stock count.
- [x] Today comparison label says "(same time)".
- [x] All four frontend gates green.
