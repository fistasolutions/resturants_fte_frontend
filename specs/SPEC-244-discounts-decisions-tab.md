# SPEC-244 — Discounts → Decisions: what the store did while each code ran

**Date:** 2026-09-15 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-251-discount-decisions.md` (`GET /discounts/decisions`)
Depends on: SPEC-186 (Cannibalisation tab — the table this mirrors), SPEC-230 (client
data cache), SPEC-232 (persistent shells)

## Problem (HCI)

"Should I run 20% again?" is answered today from memory. Cannibalisation says what a
code *cost*; nothing on the page says what the *store* did while it ran — orders per
day, revenue per day, margin — against the days just before. This tab is that memory:
one row per code, before → during, a verdict, and one sentence that says which number
tripped it.

## What this builds

A sixth Discounts tab — **Decisions**, `/discounts/decisions` — inside the persistent
discounts shell, carrying the shell's date range (30 d default; pick 90 d for a season).

```
[ 0 judged ] [ 0 worked ] [ 0 cost margin ] [ 0 no lift ] [ 7 always on ] [ 18 too small ]   $1.33M given · 87% to existing

Code              Verdict      Window            Orders   Given     To existing   Orders/day        Revenue/day           Margin
CUSTOM DISCOUNT   Always on    90 of 90 days     233      $841,540  97%           —                 —                     —
SUMMER20          Cost margin  Aug 1 – 14 · 14d  412      $9,530    73%           88 → 116 (+31%)   $12.6k → $15.2k (+21%) 44% → 36% (−8)
```

- **Summary tiles**: judged, then one per verdict (worked · cost margin · no lift ·
  always on · too small) and a right-hand line "$X given · Y% to existing".
- **Table in the backend's order** (cost margin → no lift → worked → always on → too
  small; biggest discount first within each). Verdict badge with the backend tone;
  `why` under it — the reasoning is the product.
- **Before → during cells** show `before → during (delta)`; an always-on or too-small
  row shows "—" in those cells, never a comparison that doesn't exist.
- **Margin cell** shows `before% → during% (±pts)` and greys out when coverage is under
  the backend's floor; "No cost data" when null.
- A one-line note: "Store figures are the whole store per day while the code ran vs the
  same number of days just before — movement, not attribution. Ran is the code's own
  start and end in Shopify; a hand-typed POS title has none, so its first and last use
  stand in. A code with no end date, or in use most of the period, is 'always on': there
  is no before to compare; its cost is on Cannibalisation."
- **Ran cell**: the Shopify dates when the backend's `window.source` is `shopify`, the
  first/last use otherwise; "No end date" when `window.openEnded`.
- Empty state: "No codes ran in this period — widen the date range."

## Design (root Rule 9)

Same tokens and classes as `cannibalisation-table.tsx`; badge tones `bad` / `warn` /
`good` / `neutral` / `muted`; no entrance animation; table scrolls inside its card.

## Scope

- `types/analysis.ts` — `DiscountDecision`, `DiscountDecisionsData`.
- `lib/adapters.ts` — `adaptDiscountDecisions`.
- `lib/queries/discounts.ts` — `discountPaths.decisions`, `discountQueries.decisions(from, to)`.
- `lib/discount-tabs.ts` — `{ key: "decisions", label: "Decisions", basePath: "/discounts/decisions" }`.
- `lib/discount-decisions.ts` — pure: badge class, summary tiles, the before→during
  cell text, the margin cell. Vitest-covered.
- `features/discounts/decisions-table.tsx`; `discount-tab-views.tsx` — `DiscountsDecisionsTab`.
- `app/(app)/discounts/decisions/page.tsx`.
- `tests/discount-decisions.test.ts`; `tests/discount-tabs.test.ts` (sixth tab);
  `tests/query-registries.test.ts` pins the query.
- `lib/docs/content/discounts.ts` — a "Decisions" section; `updated` bumped.

## Not changed

The other five Discounts tabs and the shell.

## Acceptance criteria

1. `/discounts/decisions` renders the tiles and the table in the backend's order with
   verdict, `why`, before → during cells and the always-on / too-small dashes.
2. The tab is active on its exact route only and carries the range across a switch.
3. `npm test`, `npx tsc --noEmit`, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

Done 2026-09-15 against the live store (Playwright, `?range=90d`):

- [x] Tiles 0 judged / 0 / 0 / 0 / 7 always on / 18 too small equal the API summary;
      "$1.3M given · 87.4% to customers who had bought before"; rows in order —
      CUSTOM DISCOUNT $838,499 (96.8% to existing), DISCOUNT, LOOP-DISCOUNT, APP25 …;
      the compare cells dash out on always-on rows.
- [x] The always-on sentence wrapped to six lines and repeated the Given column —
      shortened on the backend to one line.
- [x] `npm test` 1552 passed, `tsc` clean, `npm run build` green.
- [ ] Both themes; 400 px — same table classes as Cannibalisation; not captured today.

## Patches

- **2026-09-15 — Ran follows Shopify's dates** (backend SPEC-251 patch). `window` gained
  `source` and `openEnded`; `windowText` says "No end date" for an open-ended Shopify
  code; the note and the Discounts doc explain where the dates come from.
- **2026-09-15 — the comparison columns hide when nothing was judged.** On the live
  store every code in the range is always-on or too small, so Orders / day, Revenue /
  day and Margin were 25 rows of dashes — which reads as broken, not as "no campaign".
  `hasComparison(decisions)` (pure, `lib/discount-decisions.ts`) is false when no row
  is compared; the table then drops those three columns and `noComparisonLine(summary)`
  says why in one sentence above it ("No campaigns in this range — 7 codes are standing
  credits and 18 had under 10 orders … the comparison appears the first time a code
  with a start and end date runs"). The columns return the moment one row is judged.

