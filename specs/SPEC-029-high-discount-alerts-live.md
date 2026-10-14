# SPEC-029 — High Discount Alerts tile goes live

**Status:** Implemented
**Governing docs:** root CLAUDE.md Rules 7/8 (backend calculates; additive API
evolution). Backend contract: backend SPEC-020 — `/dashboard` payload gained
`high_discount: { products: int, min_markdown_pct: int }` (products with any
variant marked down ≥30% vs compare-at price).

## Problem

`adaptAlerts` pinned `highDiscountProducts: 0` ("not tracked in V1", SPEC-017
limitation) — the only dashboard number not driven by data. The backend metric
now exists.

## Design

- `lib/adapters.ts`: add optional `high_discount?: { products: number;
  min_markdown_pct: number }` to `ApiDashboard`; `adaptAlerts` maps
  `highDiscountProducts: dashboard.high_discount?.products ?? 0` — the `?? 0`
  keeps rendering against an older backend (same pattern as
  `inventory_counts`, SPEC-021).
- No component/type changes: `AlertsSummary.highDiscountProducts` already
  exists and the tile already renders it.

## Files

`lib/adapters.ts`, `tests/adapters.test.ts`.

## Acceptance Criteria

1. Adapter test: payload with `high_discount.products: 2273` → tile value 2273;
   payload without the key → 0 (older-backend fallback).
2. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.
3. Manual: dashboard tile shows the live count (currently ~2,273 products).
