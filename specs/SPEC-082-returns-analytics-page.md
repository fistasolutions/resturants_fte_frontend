# SPEC-082 — Returns Analytics Page (Loop Returns, Epic E)

## Problem

Backend SPEC-076 built the read-only Loop Returns connector and team-level
daily metrics API (`GET /loop/metrics`) — nothing on the frontend surfaces
it yet. Client wants a real page: today's return-processing numbers, led by
the headline "package arrival → customer refund/exchange" elapsed time
(Epic E-05), with everything else team-level (no per-employee breakdown —
Loop's API has no employee-identity field, confirmed against its own docs).

**Direct precedent, mirrored closely**: `app/(app)/team-performance/page.tsx`
(SPEC-081) — same shape of problem (a single external read-only
integration's daily metrics, no date-range/compare needed, must handle
"nothing synced yet" gracefully). Returns Analytics is simpler still: no
per-agent/per-entity table, since Loop has no entity dimension at all — just
one row of aggregate numbers for the day.

## Design

### Nav

`lib/navigation.ts`: new item **"Returns Analytics"** (`/returns`,
`RotateCcw` icon) — placed between **Customers** and **Results**, per the
design mockup already shown to and approved by the client (a "returns
process" analyst page groups with the other analyst/operational pages, not
under Integrations or Results).

### `types/returns.ts`

```ts
export interface ReturnsMetrics {
  date: string;
  has_data: boolean;
  returns_processed: number;
  items_processed: number;
  avg_returns_per_hour: number;
  avg_processing_seconds: number | null;
  refunds_completed: number;
  exchanges_completed: number;
  needs_review: number;
  open_backlog_eod: number;
  oldest_unprocessed_age_hours: number | null;
  avg_arrival_to_resolution_seconds: number | null;
  median_arrival_to_resolution_seconds: number | null;
}
```

### `services/returns.ts`

`getReturnsMetrics(date?: string): Promise<ReturnsMetrics>` → `GET /loop/metrics?date=`
via `serverApi` (RSC-side) — unwrapped/throwing like Team Performance's
`getGorgiasAgentMetrics`, since the endpoint always returns a well-formed
shape (zeros/nulls, never an exception) except on a genuine backend/network
failure.

### Shared `VerdictTile` extraction (rule of three)

`features/analysis/verdict-tiles.tsx` and `inventory-verdict-tiles.tsx`
each declare a byte-for-byte identical private `VerdictTile` component. A
third near-identical copy for Returns pushes this past the duplication
threshold — extract one shared `components/shared/verdict-tile.tsx`;
Products/Inventory switch to importing it (pure extraction, zero behavior
change, their own tests/build re-verify this) instead of a fourth copy.

### `lib/format-duration.ts` (already exists, SPEC-081)

Reused as-is for every seconds-based field here (`avg_processing_seconds`,
`avg_arrival_to_resolution_seconds`, `median_arrival_to_resolution_seconds`)
— no new duration-formatting logic needed.

### `app/(app)/returns/page.tsx`

Server component, mirrors Team Performance's page shape exactly:
- `searchParams: Promise<{ date?: string }>`, Today/Yesterday links (URL is
  the source of truth), no date-range/compare picker — Epic E is a daily
  report, not a comparison tool.
- `!metrics.has_data` → the same empty-state pattern as Team Performance:
  icon + "No Loop Returns data synced yet" + a link to `/integrations`.
- Otherwise: a **hero tile** for the E-05 headline
  (`median_arrival_to_resolution_seconds`, avg as a secondary line) styled
  distinctly (matches the artifact mockup already shown to the client —
  front and center, not just another grid tile), then a `VerdictTile` grid
  for the rest (processed/items, returns-per-hour, refunds vs exchanges,
  needs review, EOD backlog + oldest age).

### `features/returns/returns-hero-tile.tsx`

New small component — the one non-generic piece, since the headline metric
gets distinct visual treatment (larger number, two-line layout) that a
generic `VerdictTile` isn't built for.

## Non-goals

- No date-range+compare — matches both Epic E's own "reported daily" framing
  and the Team Performance precedent's identical scope decision.
- No per-employee/per-agent breakdown anywhere — impossible from Loop's API.
- No return-level drill-down table — only the aggregate numbers Epic E asks
  for; a line-item browser is a real, separate future feature, not implied
  by this spec.

## Acceptance Criteria

1. `/returns` reachable from the sidebar, between Customers and Results.
2. No data synced yet → clear empty state linking to Integrations, not a
   crash or a page full of zeros presented as real numbers.
3. E-05's elapsed-time headline is visually the first thing on the page
   once data exists.
4. Today/Yesterday navigation changes the URL and the data shown.
5. Loop Returns becomes a live `ConfigurableIntegrationCard` on
   `/integrations` (API key only, write-only) instead of the static
   "Coming soon" grid entry.
6. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all green.

## Testing Plan

No new pure logic beyond the `VerdictTile` extraction (a refactor, not new
behavior) and `format-duration.ts` reuse (already tested in SPEC-081) — full
Vitest + `tsc` + `build` re-run is the verification (root Rule 7). Manual
checklist in the browser before calling this done: empty state, populated
state, Today/Yesterday links, light/dark, mobile width — same caveat as
every other round this session: browser verification is blocked on login
credentials not supplied in this conversation.
