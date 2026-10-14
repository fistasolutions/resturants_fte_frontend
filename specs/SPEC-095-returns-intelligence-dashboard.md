# SPEC-095 — Returns Intelligence Dashboard (4-tab merchandising view)

- **Status:** In progress
- **Date:** 2026-08-05
- **Consumes:** backend SPEC-087 (`/loop/returns/{overview,by-style,by-size,by-category,style/{id}}`).
- **Client request (CEO):** turn `/returns` from the ops throughput view into a
  dense, value-oriented **merchandising + margin** dashboard, split into sub-tabs,
  driven by the Dashboard date-range filter. The value story is **sizing**
  (70% of returns are "too small/too big") and **profit lost**.

## Information architecture

`/returns` becomes a **URL-driven server-tabbed** page (no client Tabs component
exists; server tabs keep RSC data-fetching, shareable URLs, working back-button).
`?tab=` selects the active tab; the date-range params (`range`/`from`/`to`) are
preserved across tab links and drive every fetch. Only the **active tab's**
endpoint is fetched per request (no waterfall, no over-fetch).

Tabs: **Overview** (default) · **By Style** · **Sizing** · **Categories**.

- **Overview** — KPI band (Returns, Return Rate, Return Value, Refund $, Exchange
  Revenue, Exchange %, Open Backlog, **Profit Lost** hero) + the arrival→resolution
  headline (reused from `/loop/metrics`, fetched in parallel) + reason-mix bar
  (sizing dominance visible) + Top-5 styles by profit lost.
- **By Style** — table: Style # · Name · Category · Units Sold · Units Returned ·
  Return Rate · Revenue · Margin % · Top Reason · Profit Lost. Sorted by profit
  lost. Row → `/returns/style/[product_id]`.
- **Sizing** — per-style size heat grid (rate-colored cells XS→…→3XL) with
  **auto-flagged grading defects** highlighted; defect styles first.
- **Categories** — category rows (rate + profit lost bars), worst first.

`/returns/style/[product_id]` — full detail page (not a drawer, per owner
preference): header metrics + keep/fix/kill rec + size curve + reason mix +
recent returns with Shopify order links.

## Honest framing (data reality, from SPEC-087)

Loop went live ~Jul 3 2026, so aggregate return-rate is immature (return lag).
The Overview must not parade a misleading tiny aggregate rate as the hero — the
hero is **Profit Lost $**; the aggregate rate is shown with a muted "cost
coverage / recent-integration" note. Per-style rates are the actionable signal.

## Files

- `types/returns-intel.ts` — interfaces mirroring the five endpoints.
- `services/returns-intel.ts` — five `serverApi` fetchers (`from`/`to` params).
- `lib/returns-format.ts` — `formatRate(fraction)` + `rateTone(fraction)` +
  `recommendationLabel(rec)` — pure, **unit-tested** (Vitest).
- `features/returns/returns-tabs.tsx` — server tab nav (param-preserving links).
- `features/returns/kpi-stat.tsx` — reusable stat tile (tokens only).
- `features/returns/overview-tab.tsx`, `by-style-tab.tsx`, `sizing-tab.tsx`,
  `categories-tab.tsx`, `size-heat-grid.tsx`, `reason-bar.tsx`.
- `app/(app)/returns/page.tsx` — rewritten tab shell (keeps date filter).
- `app/(app)/returns/style/[product_id]/page.tsx` — detail page.

## Design (Rule 9)

Semantic tokens only — no hardcoded colors. Rate/heat coloring uses
`--destructive` (high) → `--muted` (low) via opacity ramps on tokened
backgrounds, never hex. Brand red stays identity-only. 8px spacing, card 16px /
control 10px radius. **No entrance animations** — everything renders in final
position; only CSS hover/focus. Every tab ships loading (skeleton), empty
(`has_data:false`), and error states. Keyboard-navigable tabs (real `<a>`),
semantic table, responsive (tables scroll-x on mobile; KPI band wraps).

## Performance (Rule 5)

Active-tab endpoint only; Overview parallelises its two fetches (`Promise.all`).
`serverApi` is `no-store` (fresh); tables render server-side (no client refetch).

## Testing (Rule 4)

Vitest for `lib/returns-format.ts` (rate formatting incl. null, tone thresholds,
rec labels). UI ships a manual verification checklist (no jsdom runner yet):
each tab in both themes, empty state, defect highlight visible, row→detail nav,
`npm run build` + `tsc` + `npm test` green.

## Acceptance Criteria

1. Four tabs render live data; `?tab=` + date range both drive fetches; only the
   active tab is fetched.
2. Overview hero = Profit Lost; aggregate rate shown with honest note; reason bar
   shows sizing dominance.
3. By Style table sorted by profit lost; row → style detail page.
4. Sizing heat grid colors by rate; flagged defect cells visibly highlighted.
5. Categories worst-first. Style detail shows size curve + reasons + order links + rec.
6. Both themes clean, no entrance animations, responsive; `tsc`/`test`/`build` green.

## Patches

### 2026-08-05 — close the client's literal ask to 100% (category drill + refund tile)

Client-requirements gap review found two shortfalls vs the CEO's message:
1. **Category → drill into styles** was missing (Categories tab was terminal).
2. **Refund Amount** was a sub-line under Return Value, not its own KPI.

Changes (frontend-only — `by_style` already returns `category` per row):
- **Categories tab:** each category row is now a link to
  `/returns?tab=by-style&category=<name>` (date range preserved). Bars are
  severity-colored via the shared `rateTone` tokens so the ranking reads as a
  heat map without a low-value grid.
- **By Style tab / page:** reads an optional `category` search param, filters the
  table to that category, and shows a dismissible "<category> ✕" chip. No backend
  change — filtering is client-side over the already-fetched rows.
- **Overview:** `refund_total` promoted from a hint into its own "Refund Amount"
  KPI tile (data already in the payload).

Verification: `tsc`, `npm test`, `npm run build` green; both themes; no entrance
animations; responsive.

### 2026-08-05 — instant navigation via route loading skeletons

Clicking into `/returns` felt like a hang: the page is a server component that
awaits ~2–3s of data before rendering, and with no loading state the router
stayed on the previous page until the new render fully resolved. Added
`app/(app)/returns/loading.tsx` and
`app/(app)/returns/style/[product_id]/loading.tsx` — Suspense fallbacks that
mirror each page's shape (header, tab bar, KPI band, content blocks), so
navigation commits instantly and a skeleton paints while data streams in.
Known trade-off: because the header + tab bar live in the page (not a persistent
shell), switching tabs also shows the full skeleton briefly; making tab switches
skeleton only the content area would require a persistent shell (searchParams
aren't available to `layout.tsx`) — deferred unless requested.

### 2026-08-05 — persistent shell + instant tab switches

Two follow-ups: (1) header/tab blink on tab switch, and (2) a stray vertical
scrollbar in the tab bar. Fixes:
- **Persistent shell:** header + tab bar moved into `ReturnsShell` (a `"use
  client"` component reading `usePathname`/`useSearchParams`) rendered from a new
  `returns/layout.tsx` — mirrors the `OrdersShell` pattern, so they stay mounted
  across tab switches; the detail route renders bare. `page.tsx` now renders only
  the active tab's content.
- **Instant tab switches:** a `loading.tsx` only fires on segment changes, not
  searchParam (`?tab=`) changes, so tab switches used to wait on the old tab then
  jump. The active tab's fetching now lives in an async `TabContent` wrapped in a
  **keyed `<Suspense>`** (key = `tab|from|to|category`); any of those changing
  resets the boundary and paints the `ReturnsContentSkeleton` immediately, then
  streams. Skeleton extracted to `features/returns/returns-content-skeleton.tsx`
  (shared by the route loader and the Suspense fallback).
- **Tab-bar scrollbar:** the tab row's `overflow-x-auto` (for horizontal scroll
  on narrow screens) implicitly made the vertical axis `auto`, and the active
  underline's `-bottom-px` overflowed 1px → stray vertical scrollbar. Added
  `overflow-y-hidden`.

### 2026-08-05 — AI Action Plan card + annualized tile (SPEC-096)

- **Action Plan card** (`features/returns/action-plan-card.tsx`) at the top of
  Overview — a client component fetching `/api/proxy/loop/returns/action-plan`,
  rendering the advisor's markdown via `ChatMarkdown` with generated-at + stale
  badge + refresh. Client-side so the server-rendered KPIs paint instantly while
  the LLM card loads its own skeleton (never blocks the tab). Backend: SPEC-096.
- **Annualized projection** surfaced as the Profit Lost tile hint
  (`≈ $X/yr projected`) from `overview.profit_lost_annualized` (SPEC-087 patch).
- **Visual QA done:** Playwright-drove the live app, screenshotting every tab +
  the style-detail page in light and dark — all render correctly. (Action Plan
  card content couldn't be captured live: Gemini free-tier quota was exhausted at
  the time; the card's graceful error state rendered correctly and the plan is
  proven working via the backend.)

## Patches

- 2026-08-07 — **Sizing tab: "Return rate by size" chart (owner: make it wow,
  not duplicative).** New `size-profile-chart.tsx` at the top of the Sizing tab —
  a bar chart of store-wide return rate per size (backend SPEC-087 `size_profile`),
  each bar colored by rate severity (critical→`--destructive`, high→`--warning`,
  …) so the systemic offenders pop, with a headline calling out the worst size and
  a units tooltip. This is the one view neither the per-style grids nor the
  Overview KPIs show (which sizes fail across the whole catalog) — additive, not a
  duplicate. `SizeProfileCell` type added to `BySizeResponse`. Tokens only, both
  themes, chart's built-in draw only. tsc + lint + 333 tests + build green.
