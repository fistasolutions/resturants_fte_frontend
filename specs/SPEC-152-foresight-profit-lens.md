# SPEC-152 — Foresight page shell + Profit Lens tab (V4)

Status: implemented (Profit Lens tab; Store League / Forecast / Size Intelligence tabs follow)
Depends on: backend SPEC-152 (`GET /foresight/profit`), SPEC-112 (Store Traffic shell pattern)

## Problem (V4 — "Predictions"/decision analytics)

The owner wants the cross-platform picture no single tool shows — true profit, store
standings, pace-to-goal, size intelligence — as **one new page** (not scattered). This
ships the **Foresight** page (persistent shell + tabs, best-practice rendering) with the
first tab, **Profit Lens**.

## Design

Clones the Store Traffic shell pattern exactly.

- **Tab model** `lib/foresight-tabs.ts`: `ForesightTabKey`, `FORESIGHT_TABS` (Profit Lens
  now; League/Forecast/Sizes added as each route lands), `activeForesightTab`,
  `foresightTabHref` (carries the range), `resolveForesightRange` (**30-day default** —
  profit is a period metric).
- **Shell** `features/foresight/foresight-shell.tsx` (persistent header "Foresight" +
  `DateRangePicker` + `ForesightTabs`; renders non-tab routes bare) + `foresight-tabs.tsx`
  + `app/(app)/foresight/layout.tsx`.
- **Profit Lens tab** `app/(app)/foresight/page.tsx` (server-fetch `getProfitLens`, error
  view) + `loading.tsx` (content-only skeleton). `features/foresight/profit-lens-view.tsx`
  (client) renders: a 5-tile true-profit summary (gross revenue · COGS + coverage · gross
  profit + margin% · refunds · **net profit**), a **"Selling well, barely profiting"**
  leak callout, margin-by-category + margin-by-store tables, and a **paginated**
  margin-by-product table. Margin tone: green ≥20% · amber <20% · red <0 · muted when no
  cost.
- `services/foresight.ts` `getProfitLens`, `types/foresight.ts`, and a **Foresight** nav
  entry (`lib/navigation.ts`, `Gauge` icon, NEW badge).

HCI/perf: tab-only rendering (shell persists), per-tab skeleton, pagination, semantic
tokens, no entrance animation (Rule 9), server-fetch.

## Manual verification checklist

- Left nav shows **Foresight** (NEW); opens on **Profit Lens**.
- Summary shows gross revenue → COGS → gross profit → refunds → net profit; coverage % is
  honest when costs are missing; leak callout lists thin-margin top sellers (or is absent).
- Category/store tables render; product table paginates; date picker re-ranges all.
- Light + dark; mobile; error + loading states.

## Acceptance Criteria

- [x] Foresight shell + tabs + nav; Profit Lens tab end-to-end from `/foresight/profit`.
- [x] True-profit summary + margin-leak callout + category/store/product tables (paginated).
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` (653), `npm run build` green.
- [x] Store League, Forecast & Pace-to-Goal, and Size Intelligence tabs — all four built.

## Patches

- **2026-08-21 — Size Intelligence rebuilt to the mockup's two-bar catalog view.**
  `size-intelligence-view.tsx` now renders the `ref/V4_Mockup.html` layout: a
  per-size chart with two stacked bars (sell-through green, return rate amber), a
  buy-signal verdict per size, an AI-read callout, and three KPI tiles (Selling out —
  restock / At markdown risk / Return value). Points at the new `/foresight/sizes`
  endpoint (was `/loop/returns/by-size`). `types/foresight.ts` `SizeProfileRow`→`SizeRow`
  (+ `on_hand`/`sell_through`/`avg_price`/`verdict`/`tone`) and `SizeIntelligence` gains
  `sizes`/`kpis`/`ai_read`. Backed by backend `size_intelligence` (SPEC-153).
  tsc/lint/653 tests/build green.

- **2026-08-21 — Forecast & Pace rebuilt to the mockup's per-store pace view.**
  `forecast-view.tsx` now renders three tiles (Month goal = sum of store goals, Projected
  finish with behind/ahead, To get back on pace = +$/day) and a **"Pace by store — actual
  vs projected vs goal"** card: one row per location with live MTD, projected, its own
  goal, a progress track (fill = % of goal, marker = linear-pace expectation), an
  ahead/behind footer, and an **inline per-store goal editor** (posts `location_id` +
  goal to `/settings/location-goal`), plus the AI-read callout. `types/foresight.ts` gains
  `ForecastStoreRow`/`PaceStatus` and `ForecastPace.stores`/`catch_up_per_day`/`ai_read`.
  Backed by backend `location_goals` + extended `forecast_pace` (SPEC-153). tsc/lint/653
  tests/build green.


- **2026-08-21 — Store League rebuilt to the mockup's composite health scoreboard.**
  `store-league-view.tsx` replaced its revenue-rank table with the
  `ref/V4_Mockup.html` "Store health — composite score (0–100)" layout: eight
  columns (medal + store, health score + `.scorebar`-style bar, net margin, conversion,
  discount-discipline pill, return rate, fulfill speed, support ★ pill), an AI-read
  callout (`bg-ai/5`), the three highlight tiles (Best converter / Cleanest margins /
  Needs a look), and the V-Count conversion footnote. `types/foresight.ts`
  `StoreLeague`→`StoreHealth` (composite shape); `services/foresight.ts` return type
  updated. Backed by backend `store_health` (SPEC-153). tsc/lint/653 tests/build green.
