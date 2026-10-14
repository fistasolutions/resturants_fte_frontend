# SPEC-034 — Report v2 Layout & Searchable Scope Pickers

**Status:** Implemented
**Supersedes:** the SPEC-033 tab rows (owner decision 2026-07-20: at real
cardinality — 100+ vendors, 8+ locations — tab rows are the wrong control).
**Backend contract:** SPEC-027 payload (margin, unfulfilled_by_location,
dead_stock_aged, locations) + SPEC-026 scopes.
**Owner reference:** `ref/Dashboard_v2_Mockup.html`, with real data only.

## Design

1. **Scope pickers** (`scope-picker.tsx`, client): two searchable comboboxes
   (Popover + cmdk Command) — Brand and Location — replacing the tab rows.
   Selecting pushes the scope into the URL (still the single source of truth);
   scopes are one-dimensional, so picking a brand resets location to All and
   vice versa (visible in both triggers). Keyboard: combobox pattern from
   cmdk (arrow keys, type-to-filter, Enter, Esc). Serves ALL vendors from
   `/reports/scopes`, not a top-N.
2. **Report v2 view** (`report-v2-view.tsx`, RSC) renders the 'all' scope
   when the stored payload carries the SPEC-027 keys (older reports keep the
   legacy ReportViewer — no rewriting history):
   - **Financials — daily:** Gross revenue, Net revenue, Product margin
     (coverage badge), and a greyed **Net profit — pending** tile (dashed,
     "requires accounting integration").
   - **Operations — daily:** Orders, AOV, Refunds (% of gross), greyed
     **Conversion — pending** tile ("requires traffic data").
   - **Store performance** table from `metrics.locations`: revenue, orders,
     AOV, margin% per location; Traffic/Conversion columns rendered as "—"
     with a pending note (never fake numbers).
   - **Unfulfilled orders by location** with 0–24h / 24–48h / 48h+ buckets
     (48h+ highlighted).
   - **Aged dead stock** 30/60/90+ buckets with tied-up value + top items.
   - **Inventory alerts** counts; **AI narrative** below; **completeness
     roadmap** (Live now / Needs margin data / Needs accounting) at the end.
3. All tiles tolerate missing keys (old payloads) — sections simply absent.
4. HCI checklist repeats SPEC-033's: URL state, keyboard pass, zero layout
   shift, honest pending affordances, both themes, tokens only.

## Files

`components/ui/command.tsx` (shadcn, new), `features/reports/scope-picker.tsx`
(new, replaces scope-tabs.tsx), `features/reports/report-v2-view.tsx` (new),
`types/reports.ts`, `app/(app)/reports/page.tsx`, `tests/report-scope.test.ts`
(unchanged logic still green).

## Acceptance Criteria

1. Both pickers searchable, URL-driven, mutually exclusive; all vendors listed.
2. 'all' reports with SPEC-027 payloads render the v2 layout; legacy reports
   render the old viewer untouched (Rule 7).
3. Pending tiles are visually distinct (dashed border, muted) and labeled
   with WHAT unlocks them — no fake zeros anywhere.
4. Four gates green; Web Interface Guidelines pass on the new components.

## Patches

- 2026-07-20 — **Integration-blocked tiles hidden (owner decision).** The
  always-pending "Net profit" (accounting) and "Conversion" (traffic) tiles
  are removed from the Financials/Operations grids (grids go 4→3 columns),
  and the dead "Traffic / Conv." column + its footnote sentence are dropped
  from Store performance. The **Product margin** pending fallback stays (it's
  actionable today via Shopify cost-per-item), and the completeness-roadmap
  card still lists what each future integration unlocks — tiles return when
  their integration lands. Frontend-only; the backend payload is unchanged.
- 2026-07-20 — **Completeness-roadmap card removed (owner request).** The
  "What this report answers — and what it needs next" card at the bottom of
  the v2 report is deleted; the report now ends with the AI narrative
  sections. Roadmap/upsell messaging lives in conversations and the
  Integrations page, not the daily report.

- 2026-07-20 — **Generation skeleton + inventory-only locations (owner
  requests).** (a) `ReportGenerationBoundary` now owns the generate lifecycle:
  the whole report area swaps to layout-mirroring skeletons (with an
  aria-live status line) the moment generation starts, and the fresh payload
  replaces them exactly when the router refresh lands (React transition
  keeps `pending` true until then). The button hands off to the boundary via
  context. (b) Locations with zero attributed orders are flagged
  `has_sales:false` by `/reports/scopes`; the Location picker labels them
  "· inventory only" and their scoped report leads with a warehouse notice +
  shelf health instead of $0 KPI tiles (trend/last-week/share lines hidden).

- 2026-07-21 — **Empty-location scoped view (owner bug report).** For a
  location with zero orders AND zero units on hand (old URLs — the picker
  no longer offers them, backend SPEC-026 Patches), `scoped-report-view`
  now renders the header + an explanation card instead of a wall of $0
  tiles/zero shelf/zero AI summary.
