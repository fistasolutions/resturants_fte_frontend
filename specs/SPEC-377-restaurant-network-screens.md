# SPEC-377 — Restaurant screens: Network, Menu, Operations, Guests, Royalties

**Status:** implemented 2026-10-15 · **Repo:** frontend · **Backend:** SPEC-386 (plan), SPEC-387
(network), SPEC-388 (data), SPEC-389 (analytics) · **Builds on:** SPEC-230 (client cache), SPEC-232
(persistent shells), SPEC-319/357 (navigation from the workspace), SPEC-358 (role gates), SPEC-229
(in-app docs), root Rules 4, 5, 9, 11, 13

## Why

Restaurants FTE turns the platform to multi-unit restaurant brands; the first client is a 95-branch
pizza franchise on FoodTec. The owner (head office) must see every branch and every franchise; a
franchisee sees only its own and manages its own team. These are the screens for it.

## Destinations (shown only for an organization with the `restaurant` feature)

| Sidebar title | Route | What it is |
| --- | --- | --- |
| **Network** | `/network` | The franchise network: Overview · Branches · Franchisees · Regions · Access · Data |
| **Menu Engineering** | `/menu` | Stars, plowhorses, puzzles and dogs, by category |
| **Operations** | `/operations` | Speed of service · Dayparts · Channels |
| **Guests** | `/guests` | Active, new, returning, lapsed and lost guests; the most valuable guests |
| **Royalties** | `/royalties` | Royalty and ad-fund statements per franchisee |

The backend's navigation (`services/workspace/navigation.py`) hides them for every other
organization, and hides the Shopify-only pages for a restaurant brand. `/` lands a restaurant brand
on `/network` (everyone else still on `/brief`).

Sub-routes: `/network/branches/[id]` (the branch scorecard and its details) and
`/network/franchisees/[id]` (the franchisee, its branches and its own team and roles).

## Shape (the SPEC-232 pattern)

- `app/(app)/<route>/layout.tsx` → `features/restaurant/<x>-shell.tsx` (header + tabs, persistent);
  `page.tsx` prefetches its queries (`lib/server-prefetch.ts`, not awaited) and renders the client
  view inside `HydrationBoundary`; `loading.tsx` is a content-only skeleton.
- Reads: `lib/queries/restaurant.ts` (one `defineQuery` per backend read, keyed under
  `["restaurant", …]` with every filter in the key), adapters in `lib/restaurant-api.ts`, view
  models in `types/restaurant.ts`. Writes: `services/restaurant-actions.ts`, every one in
  `lib/action-permissions.ts` with the permission the backend route policy enforces.
- Pure logic (period presets, KPI tiles, labels, quadrant order, CSV-import summary) in
  `lib/restaurant.ts`, unit-tested in `tests/restaurant.test.ts`.
- The period is URL state (`?range=7d|28d|90d` or `?from=&to=`); filters too (`franchisee`,
  `region`, `branch`). A change is a different query key — the skeleton once, instant after.

## Screens

### Network › Overview
- **Set up your restaurant brand** card when the brand is not set up (brand name, timezone,
  currency) — `RoleButton` on `network.manage`; head office only.
- KPI strip: Net sales, Transactions, Average ticket, Guests, Labor %, Food cost %, Prime cost %,
  Delivery on time, Third-party share, Discount rate — each with its change vs the previous period.
- Net sales trend (Recharts line), the top 5 and bottom 5 branches.

### Network › Branches
- The branch league: rank, quartile, store number, name, franchisee, region, net sales and change,
  transactions, average ticket, labor %, average delivery minutes, on-time rate. Filters: franchisee,
  region; search. Each row opens the branch.
- **Add branch** (dialog) and **Import branches** (CSV: a dry run shows what will be created,
  updated and what errors, then **Import**) — `RoleButton` on `network.manage`.

### Network › Franchisees
- One row per franchisee: kind, status, branches (open of total), royalty and ad-fund rates,
  contact. **Add franchisee** (dialog) on `network.manage`.
- `/network/franchisees/[id]`: details (edit on `network.manage`), its branches, and **Team**:
  members, pending invitations, roles; **Invite** (email, role, optionally some branches) and
  **New role** (name + permissions from the franchise-safe list) on `franchise_team.manage`; a
  franchise role is deleted from its row (`RoleGate`).

### Network › Regions
- Regions with their branch counts; add, rename, delete (`RoleGate` on `network.manage`).

### Network › Access (head office)
- Every member with their role and scope: *Whole network*, a franchisee, or some of its branches.
  **Change scope** dialog on `network.manage`. The owner shows *Whole network* and no control.

### Network › Data
- **Ingest keys**: name, prefix, created, last used; **New key** shows the key once with a copy
  button; revoke. **Import a file**: orders · menu · labor; the dry run shows the column mapping,
  unmapped columns, the first rows and the errors; **Import** writes. All on
  `restaurant_data.manage`. A short reference of *restaurant ingest v1* (the endpoint and the
  payload fields) for FoodTec's integration team.

### `/network/branches/[id]`
- Scorecard: the KPI strip for the branch, its rank in the network, its franchisee's and the
  network's average; the details (address, timezone, GM, POS id) with **Edit** on `network.manage`.

### Menu Engineering
- Four quadrant tiles (Stars, Plowhorses, Puzzles, Dogs) with counts and the action for each; the
  thresholds; the item table (units, mix, price, food cost %, margin, contribution, class) filterable
  by class and category; category totals. Items without a recipe cost are listed as *Needs cost*.

### Operations
- **Speed of service**: delivery average, p90, on-time and late rates, carryout average; the branch
  table worst first; the on-time target is a URL value (`target`, 30 by default).
- **Dayparts**: net sales, transactions, average ticket and share per daypart; a weekday × hour
  heat grid (token colours, intensity by opacity).
- **Channels**: channel and order-source mix with shares.

### Guests
- Tiles: active, new, returning, lapsed (30–90 days), lost (90+), orders per guest; the 25 most
  valuable guests with orders, net sales, last order and marketing opt-in.

### Royalties
- One statement per franchisee: branches trading, net sales, royalty and ad-fund rates and amounts,
  total due; totals; the basis sentence from the backend; corporate entities at 0.

## Rules kept

- Tokens only, light and dark (Rule 9); no entrance animation; skeletons while loading; every
  query has its error state with Retry.
- Every write is gated before the click (Rule 13); the server still enforces.
- Numbers come from the backend; the page formats only.

## What FOC sees (Rule 12)

Unchanged: FOC has no `restaurant` feature, so none of these destinations appear and `/` still
lands on `/brief`.

## Acceptance criteria

1. The five destinations are in `lib/navigation.ts`, each with exactly one doc (`tests/docs.test.ts`).
2. Every write in `services/restaurant-actions.ts` is in `lib/action-permissions.ts` with the
   backend's permission, and every screen calling one gates it (`tests/role-gate-coverage.test.ts`).
3. `lib/restaurant.ts` is unit-tested: period presets, KPI tiles, quadrant order, labels.
4. `npm test`, `npx tsc --noEmit` and `npm run build` pass.
5. Manual checklist (no component runner): setup card → setup; add franchisee, region, branch;
   import branches dry run then import; create an ingest key (shown once) and revoke it; import an
   orders CSV dry run then import; overview, league, menu, operations, guests and royalties render
   the backend's figures; a franchise member sees only its branches and no head-office buttons;
   franchise team invite and role creation; light and dark themes.

## Verification (2026-10-15)

AC 1 done (`tests/docs.test.ts`, `tests/navigation.test.ts`) · 2 done
(`tests/role-gate-coverage.test.ts`) · 3 done (`tests/restaurant.test.ts`) · 4 done: `npm test` 236
files / 2,706 tests green, `npx tsc --noEmit` clean, `npm run build` compiles every route (the
repo-wide `eslint .` reports 1 error and 3 warnings, all in files this spec does not touch) ·
5 done against a local demo backend (SQLite, 12 branches, ~29,600 orders): setup, branch import,
ingest key, overview, league, menu, dayparts, royalties, and the franchise owner's scoped view.

## Patches

- 2026-10-15: `/` is never gated (`lib/disclosure.ts` `accessFor`) — for a restaurant brand the
  dashboard is hidden, and the lock covered the page's redirect to `/network`.
- 2026-10-15: the adapter keeps the menu-class `counts` keys (`no_cost` was camel-cased and the
  Needs cost tile read 0).
