# SPEC-154 — Returns: make `/returns` the canonical hub, cross-link the slices

**Repo:** `ecommerce-fte-frontend`
**Status:** implemented (2026-08-22)
**Depends on / extends:** SPEC-082 (returns-analytics-page), SPEC-084
(returns-analytics-range-compare), SPEC-095 (returns-intelligence-dashboard),
SPEC-059/060/070/073 (returns-spike surfaces), SPEC-087 (orders tabs), SPEC-090
(product tabs).
**Track:** Track A1 (UX de-duplication) — owner-approved 2026-08-22.

## Why

Return data is currently presented in **five surfaces backed by four different
services**, with no canonical home and no cross-navigation between them:

| Surface | Route | Service | What it answers |
| --- | --- | --- | --- |
| Returns Analytics (dedicated) | `/returns` (Overview / By Style / Sizing / Categories) | `returns-intel.ts` + `returns.ts` | The full analytics workspace |
| Orders → Returns tab | `/orders/returns` | `services/orders` (`view=returns`) | Which *orders* were returned |
| Products → Returns tab | `/products/returns` | `services/analysis` | Product-level return money-leak + LLM verdicts |
| Orders → Returns Spike | `/orders/returns-spike` | `services/dashboard` (`getReturnsSpikeTop`) | Top styles by return rate |
| Dashboard "Returns Spike" card | → `/orders/returns-spike` | `services/dashboard` | Alert entry point |

A merchant asking "how are returns doing?" gets a different slice and a different
endpoint from four places, with **no way to move between them**. This spec does
**not** delete any surface (each shows a genuinely different slice and is reached
from a different context) — it establishes `/returns` as the **canonical hub** and
makes every other surface a clearly-labelled, cross-linked **drill-in** so the
relationship is obvious and the user can always get to the full workspace.

## Scope / product-constitution check

- **Frontend only** (Rule 1). **No API/service changes** — every endpoint, service
  function, and computed metric is untouched. This is navigation, labelling, and
  cross-linking only.
- **Rule 8 (backend calculates / AI interprets):** unchanged — no new numbers are
  computed in the UI; links point at existing pages that already fetch their own
  computed data.
- **Rule 9 (design system):** semantic tokens only, shadcn components (a small
  cross-link banner reuses existing `Card`/`Button`/`Link` patterns), no
  framer-motion, no entrance animation, both themes, keyboard-navigable.
- **Rule 7 (no regressions):** additive only — no route is removed or renamed
  (route strings are load-bearing for deep links from Results, Dashboard, Brief).
  Only visible **labels** and **added cross-links** change.

## What changes

### 1. `/returns` becomes the visible hub (`app/(app)/returns/page.tsx`)
- Add a compact **"Related returns views"** link row under the page header (tokens
  only, one line, wraps on mobile): **"Returned orders" → `/orders/returns`**,
  **"Return money-leak by product" → `/products/returns`**, **"Return-rate spikes"
  → `/orders/returns-spike`**. Each is a plain shadcn/`Link` chip with a Lucide
  outline icon. This makes the four slices discoverable from the canonical page.

### 2. Slices gain a "Full returns analytics →" cross-link back to `/returns`
A small shared, reusable component `components/shared/returns-hub-link.tsx` (new)
— a single tokened banner/button reading **"View full Returns Analytics →"**
linking to `/returns`, carrying no state. Rendered at the top of:
- `app/(app)/orders/returns` content (the Orders "Returns" tab body) — only when
  `view=returns`.
- `app/(app)/products/returns/page.tsx` (Products "Returns" tab body).
- `app/(app)/orders/returns-spike/page.tsx`.

### 3. Disambiguate the slice tab labels (labels only — routes unchanged)
- `lib/order-tabs.ts`: Orders tab `returns` label **"Returns" → "Returned Orders"**
  (it is a filtered *orders* list, not the analytics).
- `lib/product-tabs.ts`: Product tab `returns` label **"Returns" → "Return Leak"**
  (product-level money-leak, not the analytics workspace).
- `/returns` nav item label is unchanged ("Returns Analytics" in `lib/navigation.ts`
  — already the clearest name; it stays the canonical hub).

### 4. Dashboard card copy (no route change)
- `app/(app)/dashboard/page.tsx`: the "Returns Spike" alert card keeps
  `actionHref="/orders/returns-spike"` (its job is the spike drill-in) but its
  action label is clarified to **"View return-rate spikes"** so it reads as a
  slice, not "the returns page".

## Acceptance criteria

1. `/returns` shows a "Related returns views" row linking to `/orders/returns`,
   `/products/returns`, and `/orders/returns-spike`; each link works and carries no
   stale query state. `done` / `partial` / `not done`
2. `/orders/returns`, `/products/returns`, and `/orders/returns-spike` each render a
   single "View full Returns Analytics →" cross-link to `/returns` at the top of
   their content (via the shared `returns-hub-link.tsx`). `done` / `partial` / `not done`
3. Orders "Returns" tab now reads **"Returned Orders"**; Products "Returns" tab now
   reads **"Return Leak"**; both routes are unchanged and still render their existing
   content. `done` / `partial` / `not done`
4. The Orders "Returns" cross-link renders only on the returns view, not on All /
   Cancelled / Discounted. `done` / `partial` / `not done`
5. No service/API call added or changed; no route string changed; deep links from
   Results (`/returns`), Dashboard, and Brief still resolve. `done` / `partial` / `not done`
6. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.
   `done` / `partial` / `not done`

## Tests (Vitest, node env)

- `tests/order-tabs.test.ts` (extend if present, else add): `ORDERS_TABS` `returns`
  entry `label === "Returned Orders"`, `basePath === "/orders/returns"` unchanged;
  `activeOrdersTab("/orders/returns") === "returns"`.
- `tests/product-tabs.test.ts` (extend/add): `PRODUCT_TABS` `returns` entry
  `label === "Return Leak"`, `basePath === "/products/returns"` unchanged.
- `tests/returns-hub-link.test.tsx` is **not** added (no jsdom runner — Rule 4);
  the banner is covered by the manual checklist below.

## Manual verification checklist

- [ ] `/returns`: "Related returns views" row present; all three links navigate correctly.
- [ ] `/orders/returns`: "View full Returns Analytics →" banner present, links to `/returns`; tab reads "Returned Orders".
- [ ] `/orders` (All), `/orders/cancelled`, `/orders/discounted`: **no** returns-hub banner.
- [ ] `/products/returns`: banner present; tab reads "Return Leak".
- [ ] `/orders/returns-spike`: banner present; Dashboard "Returns Spike" card action reads "View return-rate spikes" and still lands here.
- [ ] Both themes correct; banner wraps on mobile; keyboard-navigable; nothing animates in on load.

## Patches

### 2026-08-22 — De-duplicate CatalogSummaryTiles (Products Overview vs Catalog)

`CatalogSummaryTiles` rendered on BOTH the Products **Overview** and **Catalog**
tabs (`features/products/product-page-content.tsx`) — the same tile row twice in one
section. Removed it from **Overview** (whose at-a-glance snapshot is already
`VerdictTiles`); it stays on the **Catalog** tab, where the catalog data lives.
Purely a display de-dup — no data/route/service change; `CatalogSummaryTiles` import
stays (still used by the Catalog tab). Reversible: re-add the one line to the overview
block to restore.

**Verification:** `npx tsc --noEmit` ✅ 0, `npm test` 676 ✅, `npm run build` ✅.
