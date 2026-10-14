# SPEC-057 — Location Cards: Mini Revenue Graph + All Locations + Period Unfulfilled

## Purpose

Enhance the Location Intelligence Cards (SPEC-055) with three improvements matching
the backend SPEC-052 changes:
1. Show ALL store locations (not just ones with orders)
2. Mini revenue AreaChart inside each card
3. Remove the hardcoded age bucket badge — unfulfilled count is now period-scoped

## Type changes — `types/dashboard.ts`

Replace `LocationKpi`:
```ts
export interface LocationKpiSeries {
  label: string;
  revenue: number;
}

export interface LocationKpi {
  location_id: number | null;
  name: string;
  revenue: number;
  orders: number;
  aov: number;
  new_customers: number;
  returning_customers: number;
  unfulfilled: number;
  // oldest_unfulfilled_bucket removed
  top_product: string | null;
  top_product_revenue: number | null;
  revenue_series: LocationKpiSeries[];
}

export interface LocationKpisData {
  period: { key: string; start: string; end: string; hourly: boolean };
  locations: LocationKpi[];
}
```

## New component — `features/dashboard/location-mini-chart.tsx`

`"use client"` — Recharts requires client rendering.

```tsx
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
// Thin area chart, 80px tall, no axes, no grid
// data: LocationKpiSeries[]
// accent color: var(--primary)
```

Tooltip shows `label` + formatted revenue. No X/Y axis labels (space-constrained card).
Empty state: if `revenue_series` is empty, show `<div className="h-20 flex items-center justify-center text-xs text-muted-foreground">No data</div>`.

## Component changes — `features/dashboard/location-cards.tsx`

- Import and render `LocationMiniChart` inside each card, below the KPI row
- Remove `oldest_unfulfilled_bucket` badge entirely
- Unfulfilled row: just `"X unfulfilled"` in muted text when > 0; `"All fulfilled"` when 0
- Zero-revenue cards: show greyed-out style (opacity-60) with "No sales this period" in place of the KPI values

## Acceptance Criteria
- [ ] All POS locations appear (even $0 in period)
- [ ] Mini chart renders with correct data
- [ ] No `oldest_unfulfilled_bucket` badge anywhere
- [ ] `npm run build`, `npx tsc --noEmit`, `npm test` green
