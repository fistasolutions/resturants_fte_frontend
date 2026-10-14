# SPEC-099 — Warehouse backfill + drilldowns + hourly-chart fix

- **Status:** In progress
- **Date:** 2026-08-06
- **Owner request (2026-08-06):** three things on `/warehouse`: (1) the "Orders
  packed by hour" chart shows numbers + labels but **no bars**; (2) a way to
  **backfill full history** from iPacky, not just yesterday/today; (3) nothing on
  the page is **drillable** — every number is a dead end.
- **Backend contract:** backend SPEC-097 (2026-08-06 patch) — the backfill endpoint
  and the two drilldown endpoints. This spec is the frontend slice that consumes it.

## 1. Hourly-chart bar fix (bug)

`features/warehouse/hourly-strip.tsx` renders each hour as a flex column inside a
`flex items-end` row of fixed `height: 120`. `items-end` overrides the default
`items-stretch`, so each column shrinks to its content height and the `flex-1` bar
track never gets vertical space → bars are 0px. **Fix:** add `h-full` to each hour
column so it fills the 120px row; the `flex-1` track then has space and the bar's
`height: N%` renders. No other change.

## 2. Backfill history

- Service `backfillIpacky({ from, to })` → `POST /warehouse/ipacky/backfill?start=&end=`.
- Component `features/warehouse/ipacky-backfill.tsx` (client), placed in the page
  header next to `IpackyUpload`. Mirrors `IpackyUpload`'s inline-status pattern (no
  toast lib): a button "Backfill this range", spinner while busy, then a
  `imported / updated / skipped` summary or an inline error. It backfills the
  **currently-selected date range** (from the existing `DateRangePicker`), so the
  merchant picks a span then clicks — no separate date UI. `router.refresh()` on
  success so the page reflects newly-ingested days.
- Guardrail message surfaced if the backend rejects a >366-day span.

## 3. Drilldowns (full pages, per owner's "full pages over drawers" preference)

### Per-packer → `/warehouse/packer/[name]`
- Row in the per-packer table becomes a link to `/warehouse/packer/<encoded name>?start=&end=`
  (carries the active range). Page lists that packer's individual order-checks:
  Order#, Checked at, Pack time, Lead time, Items, Lines, Deviation, Note.
- `getPackerOrders(name, {from,to})` → `GET /warehouse/packers/{packer}/orders`.
- Breadcrumb back to `/warehouse` (preserving range). Loading + empty + error states.

### Backlog → `/warehouse/backlog?bucket=`
- The aging-bar segments, the legend chips, and the "worth chasing" line in
  `BacklogPanel` link to `/warehouse/backlog?bucket=<key>` (segment→its bucket key;
  "worth chasing"→`aged`). Page lists the actual still-waiting orders for the bucket:
  Order#, Age (days), Ordered date, Value. Oldest first.
- `getBacklogOrders({bucket, limit})` → `GET /warehouse/backlog/orders`.
- A small bucket filter (all / 0–2d / 3–7d / 8–30d / 30d+ / worth-chasing) at top.
- Order # is intentionally the actionable key (no customer name — matches backend).

## Types (`types/warehouse.ts`, additive)
`PackerOrder { order_number, checked_at, picked_at, pack_seconds, lead_seconds,
item_quantity, line_count, deviation, note }`; `BacklogOrder { order_number,
created_at, age_days, total_price }`; `BacklogBucket` string-union.

## Tests (Vitest, node — root Rule 4)
- Pure helper `lib/warehouse-buckets.ts` (bucket key ↔ label + age-window text) unit-
  tested. Pages/components ship with the manual checklist below (no jsdom runner).

## Manual verification checklist
- Hourly chart shows filled bars scaled to the peak, in both light + dark themes.
- Backfill a small range → summary appears, page refreshes, days now present.
- Backfill a >366-day span → clear inline error, no crash.
- Click a packer row → their order list, range preserved; back link returns to the
  same range.
- Click each aging segment / "worth chasing" → backlog list filtered to that bucket,
  oldest first; empty bucket shows an empty state.
- All new pages: loading skeleton, empty state, error state; keyboard-navigable
  links; semantic tokens only; no entrance animation.

## Acceptance Criteria
1. Hourly chart renders visible bars.
2. Backfill button backfills the selected range and reports imported/updated/skipped;
   over-long span rejected gracefully.
3. Per-packer drilldown page lists that packer's orders (range-scoped).
4. Backlog drilldown page lists the real stuck orders, filterable by aging bucket.
5. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all green.

## Patches

### 2026-08-06 — backfill button removed (moved to an ops script)

Section 2's "Backfill this range" button is **removed**. The range backfill it
called 500'd on wide ranges (backend hit asyncpg's 32767 bind-parameter cap on one
oversized INSERT). Per owner direction, backfill is now an **operational script**
(`app/scripts/ipacky_backfill.py`, day-by-day walk backwards until history runs
out) rather than a UI action, so `features/warehouse/ipacky-backfill.tsx`, the
`BackfillResult` type, and the header button are gone. **Sections 1 (hourly-bar
fix) and 3 (drilldowns) stand unchanged and shipped.** Frontend tsc/lint/build +
326 tests green.
