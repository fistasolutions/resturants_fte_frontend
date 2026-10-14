# SPEC-044 — Dashboard Alert V2

**Status:** In progress  
**Repo:** `ecommerce-fte-frontend`  
**Date:** 2026-07-23

## Context

Replaces the current 4-tile alert strip (low stock count / out-of-stock count / high-discount count / refund amount) with 3 richer, dollar-value-driven alert tiles that link to the relevant page. Driven by backend SPEC-039 which adds `low_stock_revenue_at_risk`, `dead_stock`, and `returns_spike` to the dashboard API response.

Also makes the **Orders** and **New Customers** KPI cards clickable (link to `/orders` and `/customers`).

**Unfulfilled orders intentionally absent** from the dashboard — it lives in Morning Brief.

## Changes

### `types/analytics.ts`

Update `AlertsSummary`:
```typescript
export interface AlertsSummary {
  // existing (kept for backward-compat)
  lowStockVariants: number;
  outOfStockVariants: number;
  highDiscountProducts: number;
  refundsAmount: number;
  refundsCount: number;
  // new rich alerts
  lowStockRevenueAtRisk: number;        // dollar value of about-to-stockout inventory
  deadStockProducts: number;            // product count with 0 sales in 90 days
  deadStockValue: number;               // inventory value of dead stock ($)
  returnsSpikeProduct: string | null;   // worst-offending product name, null if no spike
  returnsSpikeRate: number | null;      // return rate as 0–100 %, null if no spike
}
```

### `lib/adapters.ts`

Update `ApiDashboard`:
```typescript
low_stock_revenue_at_risk?: number;
dead_stock?: { products: number; units: number; stock_value: number };
returns_spike?: { product: string | null; rate_pct: number | null };
```

Update `adaptAlerts` to map new fields (with `?? 0` / `?? null` fallbacks for older backends).

### `features/dashboard/alert-card.tsx`

Rework into a richer layout:
- **Primary line**: large dollar value or count (e.g. `$4,820`)
- **Caption line**: contextual text (e.g. "in 8 variants at risk of stockout")
- **Action link**: arrow link to the relevant page (e.g. "Review inventory →")
- Tone-driven left border accent (warning / destructive / ai)
- No icon tile — cleaner, more premium look

Props:
```typescript
interface AlertCardProps {
  tone: "warning" | "destructive" | "ai";
  title: string;
  primaryValue: string;   // formatted by parent
  caption: string;
  actionLabel: string;
  actionHref: string;
}
```

### `features/dashboard/kpi-card.tsx`

Accept optional `href?: string` prop. When present, wrap the card in a `<Link>` (Next.js) — the whole card becomes clickable. Subtle `hover:ring-1 hover:ring-border` style on hover.

### `app/(app)/dashboard/page.tsx`

Replace the 4-tile alert section with 3 new tiles:
1. **Low Stock Risk** — primary: `formatCurrency(data.alerts.lowStockRevenueAtRisk)`, caption: `"${data.alerts.lowStockVariants} variants at risk of stockout"`, href: `/inventory`, tone: `warning`
2. **Dead Stock** — primary: `formatCurrency(data.alerts.deadStockValue)`, caption: `"${data.alerts.deadStockProducts} products, 0 sales in 90 days"`, href: `/inventory`, tone: `destructive`
3. **Returns Spike** — primary: `data.alerts.returnsSpikeProduct ?? "None"`, caption: returns spike rate or "No spike detected", href: `/orders`, tone: `ai`

KPI cards: pass `href="/orders"` to orders KPI, `href="/customers"` to new_customers KPI.

Grid: `sm:grid-cols-3` (3 tiles in the alert strip).

## Manual Verification Checklist

- [ ] Low Stock tile shows dollar value from backend (not hardcoded)
- [ ] Dead Stock tile shows product count + dollar value (not hardcoded)
- [ ] Returns Spike tile shows product name + rate % when a spike exists; shows "None" / "No spike" when not
- [ ] Alert tiles link to the correct pages
- [ ] Orders and New Customers KPI cards navigate on click
- [ ] All values are real (no "0" hardcoded fallback when backend has data)
- [ ] Light and dark themes both render correctly — no hardcoded colors
- [ ] No entrance animations
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build` all green

## Acceptance Criteria

- [ ] `AlertsSummary` has 5 new fields (3 existing kept)
- [ ] `ApiDashboard` updated with new optional fields
- [ ] `adaptAlerts` maps all new fields with safe fallbacks
- [ ] `AlertCard` renders rich format with primary value + caption + action link
- [ ] `KpiCard` supports optional `href` and wraps in `<Link>` when present
- [ ] Dashboard page shows 3 new alert tiles, links correct
- [ ] All adapter logic unit-tested in `tests/`
- [ ] `npm test` green
