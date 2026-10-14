# SPEC-155 — Disambiguate confusing tab labels (Inventory transfers, "Store League")

**Repo:** `ecommerce-fte-frontend`
**Status:** implemented (2026-08-22)
**Depends on / extends:** SPEC-085 (inventory persistent tab shell), SPEC-083
(inventory tabs + store-transfers index), SPEC-088 (transfers under inventory),
SPEC-089 (dead-stock tab + dedup), SPEC-112 (traffic tabs), SPEC-152 (foresight V4).
**Track:** Track A2 (UX de-duplication) — owner-approved 2026-08-22.

## Why

Several tab **labels** collide or read ambiguously, making distinct features look
like the same thing:

1. **"Store League" appears in two sections** with the same words but different
   domains:
   - Store Traffic → **"Store League"** (`/traffic/stores`) = footfall ranking.
   - Foresight → **"▦ Store League"** (`/foresight/league`) = a **0–100 store
     *health* composite score** (margin, conversion, discount discipline, return
     rate, fulfil speed, support) — per `docs/MEMORY.md` it is literally the
     "Store health — composite score" scoreboard. Two different rankings, one name.
2. **Foresight tab labels carry decorative glyphs** (`◈ ▦ ◔ ⇅`) baked into the label
   strings — inconsistent with every other section's plain text labels and a Rule 9
   (design-system consistency) smell.
3. **Inventory "Transfers" tab is one of three "transfer" concepts** in the same
   section and its label doesn't say which: Transfers tab (`/inventory/transfers`,
   warehouse→store plan) vs `/inventory/store-transfers` (store↔store, a drill-in)
   vs `/inventory/transfers/review` (warehouse→store send). Renaming the *tab* to
   name its direction removes the worst of the confusion.

This is a **labels-only** change — no routes, services, or computed data move
(routes are load-bearing deep-link targets from Results, Dashboard, Brief).

## Scope / product-constitution check

- **Frontend only** (Rule 1). No API/service change. **No route/`basePath` change** —
  only the human-readable `label` fields in the tab model files change.
- **Rule 9:** plain semantic labels, no decorative glyphs in text; consistency with
  the other sections' tab bars. Icons (if any) stay as Lucide components, never
  literal glyphs in a string.
- **Rule 7 (no regressions):** `basePath` strings, `*TabKey` unions, `active*Tab()`
  and `is*TabRoute()` helpers are untouched, so routing, the persistent shell, and
  every deep link keep working. Only the rendered text changes.

## What changes

### `lib/foresight-tabs.ts`
- Strip the decorative glyphs from all four labels and rename the ambiguous one:
  - `"◈ Profit Lens"` → `"Profit Lens"`
  - `"▦ Store League"` → **`"Store Health"`** (names what it is — the 0–100 health
    composite — and removes the collision with Traffic's footfall "Store League").
  - `"◔ Forecast & Pace"` → `"Forecast & Pace"`
  - `"⇅ Size Intelligence"` → `"Size Intelligence"`
- `ForesightTabKey`, `basePath` (`/foresight/league` stays), and all helpers unchanged.

### `lib/inventory-tabs.ts`
- Rename the `transfers` tab label **"Transfers" → "Warehouse → Store"** (names the
  direction of the transfer plan/table it shows). `key: "transfers"` and
  `basePath: "/inventory/transfers"` unchanged.

### `lib/traffic-tabs.ts`
- **Unchanged.** With Foresight's tab renamed to "Store Health", Traffic's "Store
  League" (footfall ranking) is no longer ambiguous and keeps its name.

### Page headings (copy alignment, no logic)
- Where a page `<h1>`/breadcrumb hardcodes the old label (e.g. a "Store League"
  heading on `/foresight/league`, a "Transfers" heading on `/inventory/transfers`),
  update the visible heading text to match the new tab label so the tab and the page
  title agree. No component structure changes.

## Acceptance criteria

1. Foresight tab bar renders **Profit Lens · Store Health · Forecast & Pace · Size
   Intelligence** — no glyphs in any label. `done` / `partial` / `not done`
2. The Foresight `/foresight/league` route is unchanged and still renders the store
   health scoreboard; its page heading reads "Store Health". `done` / `partial` / `not done`
3. Inventory tab `transfers` renders **"Warehouse → Store"**; route
   `/inventory/transfers` unchanged; the page still shows the transfer plan/table.
   `done` / `partial` / `not done`
4. Traffic tab bar still reads "Store League" and is now the only "league" label in
   the app. `done` / `partial` / `not done`
5. All `*TabKey` unions, `basePath`s, `active*Tab()`/`is*TabRoute()` helpers, and
   every deep link are unchanged — no route regressions. `done` / `partial` / `not done`
6. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.
   `done` / `partial` / `not done`

## Tests (Vitest, node env)

- `tests/foresight-tabs.test.ts` (extend/add): labels equal exactly
  `["Profit Lens","Store Health","Forecast & Pace","Size Intelligence"]`; no label
  matches `/[◈▦◔⇅]/`; `basePath`s unchanged; `activeForesightTab("/foresight/league")
  === "league"`.
- `tests/inventory-tabs.test.ts` (extend/add): `transfers` entry
  `label === "Warehouse → Store"`, `basePath === "/inventory/transfers"`;
  `activeInventoryTab("/inventory/transfers") === "transfers"`.
- `tests/traffic-tabs.test.ts` (extend/add): `stores` entry `label === "Store League"`.

## Manual verification checklist

- [ ] Foresight tab bar: four plain labels, no glyphs; "Store Health" selected on `/foresight/league`.
- [ ] `/foresight/league` page heading reads "Store Health"; the scoreboard renders as before.
- [ ] Inventory tab bar: "Warehouse → Store" selected on `/inventory/transfers`; plan/table renders as before.
- [ ] Traffic tab bar still reads "Store League" (footfall).
- [ ] No two tabs anywhere in the app share the "Store League" label.
- [ ] Both themes correct; nothing animates in on load; keyboard-navigable.

## Patches

### 2026-08-22 — Remove the "Store-to-store transfers" promo card from the Warehouse → Store tab

Owner request (from a live screenshot review of `/inventory/transfers`): drop the
bottom `<Card>` ("Store-to-store transfers … Browse by store →") from the transfers
(Warehouse → Store) tab in `features/inventory/inventory-page-content.tsx`. Removed
the card block and its now-unused `import Link from "next/link"` (the `Card` import
stays — still used by the empty-state at the top of the file). Tab now ends after
`TransferTable`.

**Note (surfaced to owner):** that card was the only entry point to the
store-transfers **index** page (`/inventory/store-transfers`). Its per-store detail
pages (`/inventory/store-transfers/{locationId}`) are still reachable from the
transfer-plan rows (`lib/transfer-plan.ts`), but the bare index is now unlinked —
kept in place, pending an owner decision on whether to also retire it.

**Verification:** `npx tsc --noEmit` ✅, `eslint` on the file ✅ (0), `npm test`
676 ✅, `npm run build` ✅. No test asserted the removed card.

### 2026-08-22 — Retire the now-orphaned Store Transfers index page

Follow-on to the card removal above. That "Browse by store →" card was the only
UI entry point to the store-transfers **index** page (`/inventory/store-transfers`).
Owner said go ahead and retire it. Deleted `app/(app)/inventory/store-transfers/page.tsx`.

- **Kept & still reachable:** the per-store pages
  `app/(app)/inventory/store-transfers/[locationId]/page.tsx` and
  `[locationId]/[productId]/page.tsx` — linked directly from the transfer-plan
  rows (`lib/transfer-plan.ts`) and `features/inventory/location-transfer-review.tsx`.
  Build confirms both `/inventory/store-transfers/[locationId]` and
  `…/[locationId]/[productId]` still compile; the bare `/inventory/store-transfers`
  index is gone.
- **Now-unused (flagged, not deleted):** `getTransferEligibleLocations()` in
  `services/analysis.ts` (+ its `TransferEligibleLocation` type usage) was called
  only by the deleted index. Left in place — it maps to the live backend
  `/analysis/inventory/transfer-locations` endpoint and is ready if the browse-all
  view is ever re-surfaced. Remove on request for a fully clean retirement.

**Verification:** `npm run build` ✅ (regenerates `.next/types` — a stale generated
validator referencing the deleted route cleared on rebuild), `npx tsc --noEmit` ✅ 0,
`npm test` 676 ✅, `lint` 0 errors.
