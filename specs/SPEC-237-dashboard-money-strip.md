# SPEC-237 — Money at stake: three numbers above the Dashboard

**Date:** 2026-09-14 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-244-dashboard-money-at-stake.md` (`GET /dashboard/money`)
Depends on: SPEC-230 (client data cache), SPEC-232 (persistent shells), SPEC-233
(compact Dashboard + shared KPI strip)

**Placement (owner decision 2026-09-14):** first built on the Brief, moved to the
Dashboard the same afternoon — "the Brief is where I act, the Dashboard is where my
numbers live." The backend endpoint, service, spec and every frontend file moved
with it; nothing money-related remains under `brief`.

## Problem (HCI)

The Dashboard opens with the period's five KPIs. The owner's first question is "is
my money safe?", and the platform already knows: dead stock, stock in
the wrong location, unshipped paid orders, discount waste, policy-breaking discounts,
fixable returns, stockouts, best customers going quiet. Each lives on its own page with
its own dollar figure. Nobody puts the three sums in front of him, so the number he
would repeat to a partner — "$2.1M is sitting still" — is a tour of eight tabs away.

## What this builds

One strip, above the Dashboard's KPI strip. Three cards in a row:

```
┌ CASH SITTING STILL ─────────┐ ┌ LEAKED · LAST 30 DAYS ───────┐ ┌ AT RISK IF NOTHING CHANGES ──┐
│ $2,105,687                  │ │ $850,018                     │ │ $1,779,228                   │
│ Where is my money stuck?    │ │ Where did money quietly go?  │ │ What will I lose next?       │
│ Dead stock — no sale in 90d │ │ Manual discounts broke policy│ │ Best customers going quiet   │
│   $1,929,323 · 1,472 prods  │ │   $479,356 · 692 orders      │ │   $1,756,017 · 3,211 custs   │
│   → Review dead stock       │ │   → Review with managers     │ │   → Start win-back           │
│ Paid orders unshipped >48h  │ │ Codes that won nobody new    │ │ Best-sellers about to run out│
│   $94,498 · 355 orders      │ │   $252,016 · 105 codes       │ │   $23,212 · 47 variants      │
│   → Send overdue lists      │ │   → Review codes             │ │   → See stockout risk        │
│ + 1 more                    │ │ + 1 more                     │ │                              │
└─────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
```

- **Total first, question under it, then the lines, largest first.** A card shows its
  top two lines and folds the rest behind "+ N more" — the strip must stay short; the
  page is not.
- **Fixed windows, not the date picker's.** Trapped and at-risk are "right now",
  leaked is "the last 30 days"; the titles say so. Changing the Dashboard range does
  not change these cards, and the query key carries no range.
- **Every line is a link to the page that fixes it**, carrying the same window the
  figure was computed over (`?range=30d` on the leak lines), so the number he lands on
  is the number he clicked.
- **Tone by number, not by size:** trapped is `warning`, leaking is `destructive`, at
  risk is `warning`. A number with no lines paints its total in `text-foreground` and
  says "Nothing found" — a real zero is good news and looks like it.
- **Unknown is not zero.** `sources_missing` from the backend renders one muted line
  under the strip — "2 sources could not be read — figures are partial" — never a $0.
- **Never blocks the Dashboard.** Fetched on its own query through the client cache
  (SPEC-230): the page's Server Component starts the fetch without awaiting it; the
  strip shows a three-card skeleton while it loads and renders nothing at all if the
  request fails. KPIs, alerts and the chart paint on their own schedule exactly as
  before. Deliberately **not** under `LIVE_QUERY_OPTIONS`: eight gathered reads are not
  a once-a-minute refresh; the default 60 s `staleTime` applies.

## Design (root Rule 9)

Tokens only: `bg-card border-border`, `text-warning` / `text-destructive` for the
totals, `text-muted-foreground` for questions and counts, `rounded-xl`, 8-px scale.
No entrance animation; the skeleton is the shadcn `Skeleton`. The three cards stack to
one column under `sm`. The whole strip has `aria-label="Money at stake"`; each line
is a real `<Link>` with a visible focus ring.

## Scope

- `types/dashboard.ts` — `DashboardMoney`, `DashboardMoneyNumber`, `DashboardMoneyLine`.
- `lib/queries/dashboard.ts` — `dashboardPaths.money`, `dashboardQueries.money()`;
  `services/dashboard.ts` — `getDashboardMoney()`.
- `lib/dashboard-money.ts` — the pure builder: tone per number, visible lines + fold
  count, the amount/count sub-line, the missing-sources sentence. Vitest-covered.
- `features/dashboard/money-strip.tsx` — the component (query, skeleton, layout).
- `features/dashboard/dashboard-view.tsx` — renders `<MoneyStrip />` above
  `<KpiStrip />`; `app/(app)/dashboard/page.tsx` — prefetches
  `dashboardQueries.money()`.
- `tests/dashboard-money.test.ts`; `tests/query-registries.test.ts` pins the query.
- `lib/docs/content/dashboard.ts` — a "Money at stake" section; `updated` bumped.

## Not changed

- The KPI strip, alerts, chart, locations and the rest of the Dashboard are untouched.
- The Brief is untouched.
- No new cache, no `useEffect`+`fetch`, no server-side `await` of a service read
  (SPEC-230 rules).

## Acceptance criteria

1. `/dashboard` shows the three cards above the KPI strip with the backend's totals,
   each line linking to its `href`; changing the date range leaves them unchanged.
2. A number with no lines shows "Nothing found" and a neutral total; `sources_missing`
   renders the partial-figures line.
3. The strip's pending state is a skeleton; a failed request leaves the rest of the
   Dashboard exactly as it is.
4. `npm test`, `npx tsc --noEmit`, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

Done 2026-09-14 against the live store (Playwright capture via
`tools/capture_brief_now.mjs`, session from `tools/make_capture_session.py`):

- [x] `/dashboard` live: three cards render above the KPI strip; totals
      ($2,105,686.65 / $850,017.54 / $1,779,228.40) equal `GET /api/v1/dashboard/money`;
      every line carries its `href` with `range=30d` on the leak lines. The old
      `/brief/money` path no longer answers (422 — swallowed by `/brief/{date}`).
- [x] The third card's long label truncated on the first (Brief) capture — label
      shortened and line labels now wrap instead of clipping; re-captured clean on
      the Dashboard.
- [x] Seen on the same capture, for the owner to decide: the Dashboard's existing
      alert tiles repeat two of the strip's lines with identical figures (Dead stock
      $1,929,323.18, Unfulfilled $94,498.17), and two alert tiles use *different*
      definitions from the strip — "Low stock risk $8.0M / 21,855 variants"
      (`low_stock_revenue_at_risk`) vs the strip's stockout-board $23k / 47 variants,
      and "Misplaced stock $3.2M" (dead inventory across locations) vs the strip's
      "wrong location" $82k (best-sellers out at stores, in storage). Not changed here.
- [x] `npm test` 1477 passed, `npx tsc --noEmit` clean, `npm run build` green,
      `npm run lint` 0 errors (3 pre-existing `<img>` warnings in social/spotlight).
- [ ] Dark theme and 400 px layout: tokens are the shared `KpiStrip` ones
      (`text-warning` / `text-destructive` / `bg-card`) and the grid stacks under
      `sm`, but neither was captured today — confirm on the next capture run.
