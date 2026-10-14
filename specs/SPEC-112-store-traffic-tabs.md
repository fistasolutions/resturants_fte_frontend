# SPEC-112 — Store Traffic tabbed page (Overview · Store League · Lost-Sales)

> Renumbered from SPEC-109 → SPEC-112: a concurrent session claimed 109/110/111
> (Spotlight/Social/Performance-Ads MVPs). Re-`ls specs/` confirmed 112 free.

## Context / Why (Phase 2 of the V-Count push)

With per-location conversion now accurate (backend SPEC-101 Patches "Fix A"), the
single `/traffic` page becomes the **physical-store performance hub** — a persistent
tabbed page like Products/Inventory, adding the two highest-value "wow" views on top of
Overview.

## Scope

Convert `/traffic` into a **persistent tab shell** (mirrors Products SPEC-090 /
Inventory SPEC-085): header + date picker + tab bar stay mounted; each tab is a thin
sub-route that renders its slice.

- **Overview** (`/traffic`) — the existing `StoreTrafficView` (hero conversion, KPI
  band, by-hour + by-day charts), now under a tab.
- **Store League** (`/traffic/stores`) — stores ranked by in-store conversion; champion
  highlighted; a `sensor` badge flags a store whose door counter under-counts
  (`counter_suspect`) so a bad sensor never wins.
- **Lost-Sales** (`/traffic/opportunity`) — the money shot: total revenue "on the
  table" = lift every store to the best reliable store's conversion, per-store gaps in
  $ and extra sales. All computed by the backend (Rule 8) — the UI only presents.

## Backend (already in `/traffic/overview`, SPEC-101 Patches)

`overview` returns `by_store[]` (per-store visitors/txns/conversion/spv/aov +
`counter_suspect`) and `lost_sales` (`benchmark_store`, `benchmark_rate`, `stores[]`,
`total_opportunity`). All three tabs read this one cheap endpoint — no new endpoints.

## Frontend structure

- `lib/traffic-tabs.ts` — pure tab model + `resolveTrafficRange` (7-day default; the
  traffic page's window, not 30d) + `trafficTabHref` (carries the range across tabs).
  Unit-tested (`tests/traffic-tabs.test.ts`).
- `features/traffic/traffic-shell.tsx` (client) + `traffic-tabs.tsx` (tab bar) +
  `app/(app)/traffic/layout.tsx`.
- `app/(app)/traffic/{page,stores/page,opportunity/page}.tsx` — thin RSCs: resolve
  range → `getTrafficOverview` → render the tab's view; `TrafficError` on failure.
- New views `store-league-view.tsx`, `lost-sales-view.tsx`; extended `types/traffic.ts`.

## Performance & UX

- Each tab fetches only on its own visit; overview is one set-based query.
- **Per-tab content-only `loading.tsx`** mirroring each tab's real layout (chrome lives
  in the shell) → instant nav, zero layout shift.
- Empty states (no footfall → "Connect V-Count") and error card on each tab.

## Design (Rule 9)

Semantic tokens only (success/warning/muted/border), no Framer Motion / entrance
animations (skeleton pulse + CSS hover only), shadcn, responsive, both themes.

## Tests

`tests/traffic-tabs.test.ts` — tab matching, href range-carry, 7-day default. Views ship
with the manual checklist below (no jsdom runner).

## Manual verification checklist

- [ ] `/traffic` shows the tab bar; Overview unchanged; tabs switch instantly.
- [ ] Store League ranks by conversion; champion trophy; Pomona shows the `sensor` flag.
- [ ] Lost-Sales shows the $ opportunity + per-store gaps; suspect stores excluded.
- [ ] Date range carries across tabs; 7-day default.
- [ ] No data → "Connect V-Count" empty state; fetch failure → error card.
- [ ] Light + dark; mobile/tablet/desktop; no horizontal scroll.

## Acceptance Criteria

- [ ] Persistent tabbed `/traffic` with Overview / Store League / Lost-Sales.
- [ ] Per-tab skeletons; empty/error states; range carried.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Patches

- **2026-08-12 — Store League detailed redesign.** Backend `by_store` gained
  `visitor_share`, `sales_share`, `conversion_gap` (leader minus this store; SPEC-101
  Patches). Frontend Store League rebuilt into a premium, detailed view: a 3-tile
  insight strip (Best converter · Most footfall · Biggest gap), plus a rich comparison
  table — medal rank, visitors (+ traffic share), sales (+ share), transactions, AOV,
  per-visitor, and a conversion bar with "leader / −X pts vs leader". Champion row
  tinted + trophy; `sensor` badge + "sensor under-count" note for suspect counters.
  Tokens-only, no framer-motion, table scrolls on mobile. tsc/lint clean, 370 tests,
  build green.

- **2026-08-12 — Overview detail: per-store line chart, In/Out, smart empty state.**
  Added `StoreVisitorsChart` (Recharts multi-line via the shadcn chart wrapper — one
  line per store across the days, with a **Walk-ins / Walk-outs** toggle) fed by a pure
  `lib/traffic-chart.ts` reshape (unit-tested). Replaced the misleading "Connect
  V-Count" empty state with a connected-aware `TrafficEmpty`: when V-Count IS connected
  but the window has no data (the ~1-day feed lag), it says "No V-Count data for this
  period yet" and suggests Last 7 days — no longer telling a connected store to connect.
  Applied across all three tabs. Types gained `visitors_out` + `store_daily`. tsc/lint
  clean, 374 tests, build green.

## Patches
- **2026-08-13 — conversion trend + value-per-visitor headline (Store League).** Added a
  week-over-week **trend chip** (▲/▼ pts vs previous period) in the Conversion column and a
  **"Value per visitor"** insight tile (highest sales-per-visitor store) — directly answers
  the client's "which store is improving / squeezing the most from its foot traffic."
