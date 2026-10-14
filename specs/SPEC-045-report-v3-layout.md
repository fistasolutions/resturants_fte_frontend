# SPEC-045 — Daily Report V3 Layout

## Problem

The current report layout reads bottom-up: the most valuable content (AI Summary,
Recommended Actions) is buried at the very end, after tables of numbers. A merchant
opens the report and has to scroll past a store-performance table, an unfulfilled
orders table, a dead-stock aged panel, a top-products list, and a channels list before
reaching the AI insight they actually care about. There is also no immediate signal
for whether the day was good or bad.

## Goal

Restructure `ReportV2View` (and sync `ScopedReportView`) so the report reads
top-to-bottom: insight first, supporting numbers below.

## Changes

### `features/reports/report-v2-view.tsx`

New section order:

1. **Header row** — date, `DayBadge` (new), print, regenerate
2. **AI Summary** — moved from bottom; renders only when `sections.structured && sections.summary`
3. **Financials** — Gross revenue, Net revenue, Product margin tiles
4. **Operations** — Orders, AOV, Refunds tiles
5. **Store performance** table
6. **Unfulfilled by location** | **Aged dead stock** (2-col grid, unchanged)
7. **Top products** | **Sales by channel** (2-col grid, unchanged)
8. **Risks** | **Opportunities** (2-col grid, unchanged)
9. **Recommended actions** — styled with a subtle primary tint to signal "act on this"

#### New sub-components

`DayBadge({ changePct })` — reads `sales.change_pct?.gross_revenue`:
- `> 5%` → green badge "↑ Strong day"
- `< -5%` → amber badge "↓ Watch closely"
- `-5%..5%` → muted badge "→ Flat"
- `null` → nothing

`SectionLabel` — updated: label text left-anchored, `h-px flex-1 bg-border` rule
extends right, creates a clear visual separator between sections.

`Tile` — new optional `change?: number | null` prop renders a colored delta:
- positive → `text-success ▲ X% vs prior day`
- negative → `text-destructive ▼ X% vs prior day`
- zero → `text-muted-foreground`

The old `delta()` helper function is removed (replaced by the prop).

### `features/reports/scoped-report-view.tsx`

Same AI Summary → top reorder: `sections.summary` rendered immediately after the
header row, before the KPI tiles.

## No backend changes

All data is already present in the report payload. No new fields needed.

## Acceptance Criteria

- [ ] AI Summary card appears as the first content section (below the date/meta row)
- [ ] `DayBadge` renders on the header line next to the date
- [ ] Positive revenue change shows green delta in the Gross Revenue tile
- [ ] Negative revenue change shows red (destructive) delta
- [ ] Section labels have a right-extending horizontal rule
- [ ] Recommended actions section has a visible primary-tinted treatment
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build` all pass
- [ ] No entrance animations introduced (Rule 9)

## Manual verification checklist

- Open the reports page with a report that has an AI narrative
- Confirm AI Summary is the first section after the date line
- Confirm DayBadge shows correct color for positive/negative/flat revenue
- Confirm all tiles show colored deltas where change_pct is available
- Confirm section headers have the horizontal rule
- Confirm Recommended Actions has a distinct background tint
- Toggle dark/light mode — all colors use semantic tokens only
- Scoped report (brand/location tab) — confirm Summary also moved to top there
