# SPEC-156 — Results: add the missing `transfers` outcome-link type

**Repo:** `ecommerce-fte-frontend`
**Status:** implemented (2026-08-22)
**Depends on / extends:** SPEC-067 (results-page), SPEC-063 (backend brief
transfer send-history / outcomes), SPEC-088 (transfers under inventory).
**Track:** Track A3 (UX de-duplication / latent-bug fix) — owner-approved 2026-08-22.

## Why

The Results page has a **Transfers** tab and `ResultsData.transfers: OutcomeEntry[]`
(`types/results.ts`), but the `OutcomeLink` union has **no `transfers` variant** and
`resolveLink()` in `features/results/results-tabs.tsx` has **no `transfers` case**:

```ts
// types/results.ts — OutcomeLink has overdue | orders | inventory | dead_inventory
// | customers | traffic | discounts | warehouse | support | returns  ← no "transfers"
```

So every transfer outcome entry must set its `.link` to some *other* type (e.g.
`inventory` or `warehouse`) to render a "View details →" target — its deep link
does **not** point at the transfer review surface it came from. The tab taxonomy
(10 tabs incl. Transfers) and the link taxonomy (10 variants **without** transfers)
are misaligned. This closes the gap by giving transfer outcomes their own link type
and a correct destination.

## Destination

Transfer sends originate from the warehouse→store **transfer review** flow. The
correct drill-in target is the transfer review page, addressed by location:
`/inventory/transfers/review` (send-all) or, when a location key is present,
`/inventory/transfers/review/send/{locationKey}`. To mirror the existing
`overdue`/`orders` shape (which carry `location_key`), the new variant carries an
**optional** `location_key`.

## Scope / product-constitution check

- **Frontend only** (Rule 1). Adds a type variant + a `switch` case + a routing
  string. No API/service change.
- **Backend contract note (Rule 1 — backend-first):** the backend `/results`
  response (`OutcomesService`) is what populates `link.type`. This spec makes the
  **frontend able to render** a `{ type: "transfers", location_key? }` link; whether
  the backend *emits* it is a **separate backend change** (out of this spec's scope,
  flagged below). Until then, transfer entries that arrive with an `inventory`/
  `warehouse` link keep resolving exactly as today — this change is **purely
  additive and backward-compatible** (Rule 7): no existing link type or destination
  is altered.
- **Rule 9:** no visual change; same "View details →" `Link`.

## What changes

### `types/results.ts`
- Add to the `OutcomeLink` union:
  ```ts
  | { type: "transfers"; location_key?: string }
  ```

### `features/results/results-tabs.tsx`
- Add a `case "transfers"` to `resolveLink()`:
  ```ts
  case "transfers":
    return link.location_key
      ? `/inventory/transfers/review/send/${link.location_key}`
      : "/inventory/transfers/review";
  ```
- The `switch` becomes exhaustive over the widened union (TypeScript will enforce
  this — the current code compiles only because there is no `transfers` variant yet;
  after widening, the missing case would be a type error, which this case resolves).

## Out of scope (flag for a follow-up backend spec)

- Making the backend `OutcomesService` actually emit `link.type === "transfers"`
  (with `location_key`) for transfer send outcomes. Until that ships, the frontend
  simply *supports* the type; transfer entries render with whatever link the backend
  currently sends. This spec does not change what the backend emits.

## Acceptance criteria

1. `OutcomeLink` includes `{ type: "transfers"; location_key?: string }`.
   `done` / `partial` / `not done`
2. `resolveLink({ type: "transfers", location_key: "loc-1" })` →
   `"/inventory/transfers/review/send/loc-1"`; `resolveLink({ type: "transfers" })`
   → `"/inventory/transfers/review"`. `done` / `partial` / `not done`
3. `resolveLink()` is exhaustive over the widened union with no `default` swallow and
   no `ts` error; every pre-existing link type resolves to its **unchanged**
   destination. `done` / `partial` / `not done`
4. No visual/behavioural change to any non-transfer outcome entry. `done` / `partial` / `not done`
5. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.
   `done` / `partial` / `not done`

## Tests (Vitest, node env) — `tests/results-links.test.ts` (new)

Export `resolveLink` (or a thin pure wrapper) for testing, then assert:
- `transfers` with `location_key` → `/inventory/transfers/review/send/{key}`.
- `transfers` without `location_key` → `/inventory/transfers/review`.
- A representative sample of the pre-existing variants (`overdue`, `orders` with a
  location, `dead_inventory` with ids, `returns`, `support`) still resolve to their
  documented destinations (regression guard).

> If `resolveLink` is currently module-private, the minimal change is to `export`
> it (it is a pure function of its argument) — no behavioural impact.

## Manual verification checklist

- [ ] Results → Transfers tab: entries render a "View details →" link.
- [ ] A transfer entry carrying `{type:"transfers", location_key}` lands on the
  matching `/inventory/transfers/review/send/{key}` page.
- [ ] A transfer entry with no location key lands on `/inventory/transfers/review`.
- [ ] Every other tab's entries (Overdue, Orders, Dead Inventory, Returns, Support,
  Warehouse, Discounts, Winback, Store Traffic) still deep-link exactly as before.
- [ ] `npx tsc --noEmit` passes with the widened, exhaustive switch.
