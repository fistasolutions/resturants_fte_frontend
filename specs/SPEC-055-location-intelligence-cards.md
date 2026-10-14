# SPEC-055 — Location Intelligence Cards (Frontend)

## Purpose

Render per-POS-location KPI cards at the bottom of the main dashboard. Each card
shows: revenue, orders, AOV, new/returning customer counts, open unfulfilled order
count with an age urgency badge, and the top-selling product — with a link to the
Orders Review page pre-filtered for that location. Backend endpoint: `GET
/dashboard/locations` (backend SPEC-050).

## Data model

Add to `types/dashboard.ts`:
```ts
export interface LocationKpi {
  location_id: number | null;    // null = Online Store
  name: string;
  revenue: number;
  orders: number;
  aov: number;
  new_customers: number;
  returning_customers: number;
  unfulfilled: number;
  oldest_unfulfilled_bucket: "<24h" | "24-48h" | "48h+" | null;
  top_product: string | null;
  top_product_revenue: number | null;
}

export interface LocationKpisData {
  period: { start: string; end: string };
  locations: LocationKpi[];
}
```

## Service

Add to `services/dashboard.ts`:
```ts
export async function getLocationKpis(from: string, to: string): Promise<LocationKpisData> {
  return serverApi<LocationKpisData>(`/dashboard/locations?start=${from}&end=${to}`);
}
```

No adapter needed — response shape maps 1:1 to the interface.

## Component — `features/dashboard/location-cards.tsx`

Pure Server Component (no `"use client"`).

Props:
```ts
interface Props {
  data: LocationKpisData;
  from: string;
  to: string;
}
```

Layout: responsive grid — 1 col mobile, 2 col tablet, auto-fit up to 3 wide desktop.
Each location card:

```
┌─────────────────────────────────────────────┐
│ [MapPin icon]  Ecommerce FTE – Downtown    │
│                                              │
│  Revenue         Orders        AOV           │
│  $45,000         150           $300          │
│                                              │
│  New customers   Returning                   │
│  45              105                         │
│                                              │
│  ⚠ 12 unfulfilled  [48h+ badge]             │
│  Top: Classic Tee  $8,500               │
│                                              │
│  [Review orders →]                           │
└─────────────────────────────────────────────┘
```

Unfulfilled urgency badge:
- `"48h+"` → `destructive` tone (red)
- `"24-48h"` → `warning` tone (amber)
- `"<24h"` → `muted` tone (gray)
- `null` / 0 → "All fulfilled" in muted text, no badge

The "Review orders →" link goes to `/orders/review?location=<location_id>` (or
`/orders/review` for `location_id === null`, online orders).

Design: same card shell as `AlertCard` (bg-card, border-border, rounded-2xl, p-5).
Tokens only — no hardcoded colors.

## Dashboard page changes — `app/(app)/dashboard/page.tsx`

1. Add `getLocationKpis` to the `Promise.all` call:
```ts
const [data, locationData, user, store] = await Promise.all([
  getDashboardData(...),
  getLocationKpis(range.from, range.to),
  getCurrentUser(),
  getStoreConnection(),
]);
```

2. Add a new `<section>` after the alerts section:
```tsx
<section aria-label="Location performance">
  <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
    Location Intelligence
  </h2>
  <LocationCards data={locationData} from={range.from} to={range.to} />
</section>
```

Only render the section when `locationData.locations.length > 0`.

## Tests

No lib/utils/services pure logic to unit-test for this feature (service is a thin
proxy). Tests live in the backend (SPEC-050).

Manual verification checklist:
- [ ] Location cards appear below the alert cards on the dashboard
- [ ] Each POS location gets a card; "Online Store" appears when there are online orders
- [ ] Revenue, orders, AOV numbers match the backend response
- [ ] Unfulfilled badge color: red for 48h+, amber for 24-48h, gray for <24h
- [ ] "Review orders →" link routes to the correct filtered URL
- [ ] Cards render correctly in light and dark theme
- [ ] No entrance animations (content renders in final position)
- [ ] On mobile (< 640px): single-column stacked cards
- [ ] When `locations` is empty (no sales in period): section not rendered

## Acceptance Criteria

- [ ] `LocationKpi` and `LocationKpisData` interfaces in `types/dashboard.ts`
- [ ] `getLocationKpis()` in `services/dashboard.ts`
- [ ] `LocationCards` component in `features/dashboard/location-cards.tsx`
- [ ] Dashboard page passes data + renders section
- [ ] `npm run build`, `npx tsc --noEmit`, `npm test` all green
