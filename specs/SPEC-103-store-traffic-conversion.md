# SPEC-103 — Store Traffic & Conversion page (V-Count)

- **Status:** In progress
- **Date:** 2026-08-07
- **Backend contract:** SPEC-101 (V-Count footfall + conversion). This is the
  consuming UI: a new **Store Traffic** page, a V-Count Integrations card, and the
  sidebar entry.
- **Goal:** show the metric Shopify can't — **in-store conversion** (visitors →
  transactions) — as a premium, WOW dashboard. Presentation only; every number is
  backend-computed (Rule 8). Design system only (Rule 9): semantic tokens, subtle
  shadows, no Framer Motion, no entrance animation; verified light + dark.

## Route & page (`app/(app)/traffic/page.tsx` → `features/traffic/*`)
- RSC fetches `getTrafficOverview({from,to})`; standard `DateRangePicker` (reuse).
- **KPI band:** Visitors, Transactions, **Conversion rate** (hero, `--ai`/`--success`
  accent), Sales per visitor, AOV. Big tabular numbers, tone-aware.
- **Conversion-by-hour** panel: pure-CSS dual encoding — visitor bars + a
  conversion-rate value per hour (peak + best-converting hour highlighted). Shows
  the day's shape and where traffic converts vs. leaks.
- **Daily trend** panel: visitors vs. conversion over the range (CSS bars/line, no
  chart lib), so a slow stretch reads as a traffic problem or a conversion problem.
- **Peaks** callout: busiest hour + best-converting hour.
- **States:** loading skeleton; **"Connect V-Count" empty state** when `has_data` is
  false (creds not set yet / no footfall) — a clear, on-brand call to configure it
  in Integrations, not a broken page; error state on fetch failure.

## Types (`types/traffic.ts`) + service (`services/traffic.ts`)
`TrafficTotals`, `HourlyTraffic`, `DailyTraffic`, `TrafficPeaks`, `TrafficOverview`;
`getTrafficOverview` via `serverApi("/traffic/overview?start=&end=")`.

## Integrations card (`features/integrations/*`, `types/integrations.ts`, adapter)
Add `vcount` to `IntegrationSettings`, the adapter (`adaptProvider(data.vcount)`),
`PROVIDER_META` (name "V-Count", category "Store Traffic", username + sync-time
fields, password secret), and render a `<ConfigurableIntegrationCard provider="vcount">`
on the Integrations page.

## Sidebar (`lib/navigation.ts`)
Add **"Store Traffic"** (`/traffic`, a footfall/activity icon, `badge: "NEW"`), near
Warehouse/Team Performance.

## Pure helper + test
`lib/conversion.ts`: `conversionRate(transactions, visitors)` (guard ÷0 → null) and
a `formatConversion` (→ "x.x%"), unit-tested in Vitest.

## Manual checklist
- Both themes; no entrance animation; focus-visible on interactive bits.
- Empty state shows when V-Count isn't connected (the current reality) — not a crash.
- Responsive: KPI band + panels stack on mobile; no horizontal page scroll.
- Numbers match the backend overview payload (formatting only).

## Acceptance Criteria
1. Store Traffic page renders the KPI band, hourly conversion, daily trend, peaks.
2. Graceful "connect V-Count" empty state until footfall exists.
3. V-Count Integrations card + sidebar entry.
4. Conversion helper unit-tested; `tsc`, `lint`, `test`, `build` all green.

## Patches

### 2026-08-07 — instant-navigation skeleton + .env.example

- Added `app/(app)/traffic/loading.tsx` — the page awaits its data server-side, so
  without a segment `loading.tsx` a nav click blocked on the previous page until the
  fetch resolved. Next.js now shows this skeleton (header + hero + KPI band + two
  chart placeholders) instantly on click, then swaps to real content. Same pattern
  as the Warehouse/Orders segments.
- Backend `.env.example` documents the V-Count keys (`VCOUNT_USERNAME`,
  `VCOUNT_PASSWORD` required; `VCOUNT_BASE_URL` / `VCOUNT_STORE` / `VCOUNT_SYNC_TIME`
  optional with defaults).
