# SPEC-084 — Returns Analytics: Range + Compare

- **Status:** In progress
- **Date:** 2026-08-01
- **Backend contract:** `ecommerce-fte-backend` SPEC-079 —
  `GET /loop/metrics` now takes the same `start`/`end`/`compare` contract as
  `/brief/kpis`, response shape changed from a flat object to
  `{period: {start, end, compare}, metrics: {...same fields..., change_pct}}`.

## What changes on `/returns`

Replace the Today/Yesterday links with the real `<DateRangePicker>`
(`features/dashboard/date-range-picker.tsx`, reused — same component
Brief/Dashboard already use), defaulting to today + previous_period. Each
`VerdictTile` and the hero tile gain a `DeltaBadge` sourced from the
backend's `change_pct`. Backlog/needs-review stay un-compared (snapshot
concepts, no `change_pct` entry for them on the backend).

## Implementation

- `types/returns.ts` — replace the flat `ReturnsMetrics` interface with the
  new nested shape: `ReturnsMetricsResponse { period: {...}; metrics: ReturnsMetrics }`,
  `ReturnsMetrics` gains `change_pct: Record<ComparableField, number | null>`.
- `services/returns.ts` — `getReturnsMetrics({ from, to, compare })` mirrors
  `getBriefRangeKpis`'s exact pattern.
- `app/(app)/returns/page.tsx` — `resolveDateRange`/`resolveCompareMode`
  from `lib/date-range.ts` (unchanged, generic), `<DateRangePicker
  basePath="/returns">`. `has_data` empty-state logic unchanged.
- `features/returns/returns-hero-tile.tsx` — gains a `deltaPct`/`compareLabel`
  prop, renders `<DeltaBadge>` next to the median duration.
- Decision on the hero's `invertDelta`: elapsed time going *up* is worse
  (slower resolution) — `invertDelta` on, same convention as Brief's
  Refunds tile and risk-sentiment decision cards.
- `VerdictTile` usages on `/returns` — since the shared component doesn't
  render a delta itself (Products/Inventory don't need one), add delta
  badges as a `caption` suffix reusing `DeltaBadge` inline next to each
  tile's value, matching how Brief's decision cards compose `DeltaBadge` +
  text rather than baking it into `VerdictTile` itself (keeps the shared
  component's contract unchanged for its two existing consumers).

## Tests

No new pure logic — `DeltaBadge`/`lib/date-range.ts` are pre-existing and
tested. Full Vitest + `tsc` + `build` re-run (Rule 7).

## Acceptance criteria

- [ ] `/returns` shows the same range+compare picker as Brief/Dashboard.
- [ ] Hero tile and verdict tiles show compare deltas from the backend.
- [ ] Empty state (`has_data=false`) unaffected.
- [ ] `npx tsc --noEmit`, `npm test`, `npm run lint`, `npm run build` green.
