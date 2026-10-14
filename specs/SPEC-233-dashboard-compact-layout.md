# SPEC-233 — Dashboard: the compact layout

Status: implemented (2026-09-12)
Depends on: SPEC-231 (the panel/row/strip vocabulary this reuses), SPEC-232 (the
Dashboard shell that owns the header), SPEC-230 (client cache), SPEC-004/021/028/044/
184/190/202 (every section on the page today)
Mockup: `ref/dashboard-compact-mockup.html` — approved by the owner on 2026-09-12
("just wow, I want the same UI").

## Problem

`/dashboard?range=7d` is **3,935px** tall. Five KPI cards wrap 3 + 2 at 1440px; five
alert cards wrap 4 + 1; nine location cards (three of them "No sales this period")
take three rows of 260px each; "What changed" lists ten products in full; Top Products
lists ten with 36px thumbnails; Sales by Channel is a 176px donut carrying four numbers.
Everything is a card with its own padding, sitting in a section with its own padding.

## The one rule of this spec

**Presentation changes. Behaviour does not.** Every query, refetch policy, number,
link, empty state and error state survives:

- the five cached queries and `LIVE_QUERY_OPTIONS` (minute refetch, pause when hidden)
- the KPI links (`orders` → `/orders`, `new_customers` → `/customers`), the compare
  label, "—" when there is no baseline (never a fake 0%)
- the five alerts with their exact captions, hrefs, and all-clear messages; the
  misplaced-stock alert degrading on its own when its query fails
- Net sales only when the backend serves it; What changed only when it has movers
- the location review links (`/orders/review?location=…`, unfiltered for channels)
- the revenue chart's compare line and labels; the recent-orders status badges
- the error panel and the skeleton

`lib/adapters.ts`, `lib/queries/dashboard.ts`, `types/*` and the page are untouched.

## The layout (mockup, measured 1,557px = 40% of today)

```
header (SPEC-232 shell, unchanged)
KPI STRIP     Revenue · Net sales · Orders · Avg order · Returning · New customers
ALERT STRIP   Unfulfilled · Low stock · Dead stock · Returns spike · Misplaced stock
┌─ main (≈64%) ───────────────────────────┐ ┌─ rail (≈36%) ──────────────┐
│ REVENUE          chart, legend           │ │ NET SALES     4 rows        │
│ LOCATIONS        table: trend · revenue ·│ │ WHAT CHANGED  top 5 + fold  │
│                  orders·AOV · new·ret ·  │ │ SALES BY CHANNEL  bars      │
│                  unfulfilled · review →  │ │ TOP PRODUCTS  top 5 + fold  │
│                  quiet locations: 1 line │ └─────────────────────────────┘
│ RECENT ORDERS    table, "All orders →"   │
└─────────────────────────────────────────┘
```

Under 1024px the rail stacks under the main column; the strips go 3-up then 2-up.

### Shared vocabulary (promoted from the Brief)

SPEC-231 built `BriefPanel` / `BriefRow` / `BriefDot` and `BriefStrip` for one page.
The Dashboard is the second page, so they move to `components/shared/panel.tsx` and
`components/shared/kpi-strip.tsx` (with `StripTile` in `lib/kpi-strip.ts`), and the
Brief files become one-line re-exports — no Brief import changes, no Brief behaviour
changes.

### KPI strip — `lib/dashboard-strip.ts`

Six tiles: the five `Kpi`s in their backend order with **Net sales** inserted after
Revenue (omitted when `netSales` is null, as the card is today). Value formatting is the
existing `formatKpiValue` rule (currency / percent / number); the delta is
`changePercent` with `comparisonShortLabel`, and a tile with no baseline shows the
label alone rather than a dash. Orders and New customers stay links.

### Alert strip — `lib/dashboard-alerts.ts`

The five alerts as one row of tiles: tone dot, label, value, caption, link. The caption
text is moved verbatim from the view into this module so it is unit-tested for the
first time (pluralisation, "sent to managers" wording, the misplaced-stock join). An
all-clear alert keeps its `allClearMessage`, with a success dot and the value replaced
by the message. Tones map to the existing ones: destructive → `hi`, warning → `md`,
ai → `ai`.

### Locations — `features/dashboard/location-table.tsx`

One table row per selling location: name (with "Top: product · $revenue" beneath it),
a 64×20 sparkline (the existing `LocationMiniChart`, sized down), revenue, orders ·
AOV, new · returning, unfulfilled (a destructive pill, or a check when zero). The
location name is the review link (a seventh column did not fit at 1440px). Locations with no revenue and no orders collapse into **one quiet footer
row** — "No sales this period — A · B · C", each name still linking to its review
page — instead of three empty cards. `lib/location-table.ts` does the split.

### Rail

- **Net sales**: four `PanelRow`s; deductions negative in destructive; the net row on a
  muted background with its own bigger figure. Discounts and returns also show their
  share of gross (backend numbers, one division for display — the same class of
  formatting the waterfall already does with the minus sign).
- **What changed**: panel header carries the total delta and %; the concentration
  sentence is the first row; movers fold at 5 with "Show N more" (`lib/fold.ts`).
- **Sales by channel**: one row per channel with a proportional bar and the percentage.
  The donut goes; four numbers do not need a chart.
- **Top products**: rows with the existing thumbnails at 28px, revenue right, orders
  beneath the name; fold at 5.

### Main

- **Revenue**: the same Recharts chart inside a panel, legend in the header, 208px tall
  (was 256px in a card with its own header).
- **Recent orders**: the same shadcn table inside a panel, "All orders →" in the header.

## Design (root Rule 9)

Tokens only; `--destructive` / `--warning` / `--success` / `--ai` for tone, brand red
never. 8px scale; 16px panel radius, 12px tiles; no entrance animation — the only
motion is the skeleton pulse, the fold chevrons, and Recharts' hover.

## Scope

1. `components/shared/panel.tsx`, `components/shared/kpi-strip.tsx`,
   `components/shared/delta-badge.tsx`, `lib/kpi-strip.ts` — promoted from the Brief;
   `features/brief/brief-panel.tsx`, `features/brief/brief-strip.tsx`,
   `features/brief/brief-kpis.tsx`, `lib/brief-strip.ts` re-export (Returns keeps its
   `DeltaBadge` import path).
2. `lib/dashboard-strip.ts`, `lib/dashboard-alerts.ts`, `lib/location-table.ts`,
   `lib/fold.ts` — pure, Vitest-covered.
3. `features/dashboard/alert-strip.tsx`, `location-table.tsx`, `channel-bars.tsx` — new.
4. `features/dashboard/revenue-chart.tsx`, `net-sales-waterfall.tsx`,
   `what-changed-card.tsx`, `top-products.tsx`, `recent-orders.tsx` — presentation only.
5. `features/dashboard/dashboard-view.tsx` — the composition; `dashboard-skeleton.tsx`
   mirrors it.
6. Removed, now unused: `kpi-card.tsx`, `alert-card.tsx`, `location-cards.tsx`,
   `channel-donut.tsx`.

## Acceptance criteria

1. Every number, link, caption and empty state on today's page is present. — done
   (captions, hrefs and all-clear messages pinned by `tests/dashboard-compact.test.ts`)
2. All five queries, `LIVE_QUERY_OPTIONS`, the error panel and the degrade paths are
   unchanged. — done (the view's query block is untouched)
3. Six KPI tiles with `netSales`, five without; deltas and links correct. — done
4. Five alert tiles, all-clear state intact, misplaced alert degrades alone. — done
5. Quiet locations collapse to one line, each still linking to its review page. — done
   (live: "No sales this period — MILL warehouse · Y London · Z Israel")
6. What changed and Top products fold at five. — done (two "Show 5 more products"
   buttons found and exercised live)
7. Page height on `?range=7d` at most **45%** of 3,935px. — done: **1,669px (42%)**;
   today's view 1,425px
8. Both themes; 900px stacks; no entrance animation. — done
   (`ref/screens/dashboard-compact/`)
9. `npm test`, `tsc`, `lint`, `build` green; Brief tests unchanged. — done (116 files /
   1,372 tests; lint's 3 warnings pre-existing in social/spotlight; `/brief` re-captured
   after the shared-component move: six tiles, three decisions, no console errors)

## Manual verification (no jsdom runner — root Rule 4)

Captured by the SPEC-231 driver pointed at `/dashboard` → `ref/screens/dashboard-compact/`:

- [x] `/dashboard?range=7d` light and dark — 1,669px (`light-live.png`, `dark-live.png`).
- [x] `/dashboard` (today) — hourly chart labelled "hourly", 2 selling · 6 quiet
      (`light-today.png`).
- [x] Folds open (`light-fold-open.png`); location names link to review pages;
      "All orders →", "Store League →", "Product Analyst →" present.
- [x] 900px viewport — strips 3-up/2-up, rail stacks (`light-900.png`); the locations
      table scrolls horizontally inside its panel, as tables may.
- [x] `/brief` unchanged after the shared-component move (`brief-after-move.png`).
- [ ] An all-clear alert tile (green dot, message in place of the value) — not
      reachable on 2026-09-12 (every alert fires); logic pinned by the unit test.

## Patches

### 2026-09-12 — the Locations table scrolls past four rows (owner decision)

The owner's call on seeing the table: *grow to four, and after four it scrolls
vertically, automatically.* So the one exception to "fold, never scroll" on these two
pages: with more than `LOCATION_ROWS_VISIBLE` (4) selling locations the table body sits
in a `max-h-68 overflow-y-auto` region under a sticky header — four rows at natural
height, a sliver of the fifth showing there is more. With four or fewer nothing
changes. The quiet-locations line stays below the scroll region, always visible.
`locationsScroll()` in `lib/location-table.ts` is the pinned rule.
