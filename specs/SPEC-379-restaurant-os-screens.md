# SPEC-379 — Restaurant OS screens: menu catalog, POS, kitchen and dispatch, online ordering, tracker

**Status:** implemented 2026-10-15 · **Repo:** frontend · **Backend:** SPEC-391 (plan), SPEC-392
(catalog, pricing), SPEC-393 (POS, kitchen, dispatch), SPEC-394 (storefront, tracker) · **Builds
on:** SPEC-377 (restaurant screens), SPEC-358 (role gates), SPEC-229 (docs)

## Why

Restaurants FTE takes its own orders (owner, 2026-10-15). These are the screens: head office builds
the menu, branches take orders at the counter and on the phone, the kitchen bumps tickets, dispatch
sends drivers out, and guests order on the brand's own site and follow their order live.

## Destinations

| Sidebar title | Route | Who |
| --- | --- | --- |
| **Menu** (was Menu Engineering) | `/menu` | Tabs: **Engineering** (SPEC-377) · **Catalog** · **Offers** · **Branch menu** |
| **Order Taking** | `/pos` | `orders.take` |
| **Kitchen & Dispatch** | `/kitchen` | `kitchen.operate` — tabs **Kitchen** · **Dispatch** · **Drivers** |

Public, no sign-in (added to `proxy.ts`'s open routes):
- `/order/[slug]` — the brand's online ordering: pick delivery (postal code → delivering branches) or
  carryout (branch list), the menu, the pizza builder, the cart with the backend's live total, checkout
  (name, phone, address, payment: cash, card on delivery, pay at store), confirmation.
- `/track/[token]` — the live tracker: stage steps (placed → making → oven → ready/out → done) with
  each time, the quoted time, the driver's first name, the order; refreshes every 20 seconds.

## Screens

- **Menu › Catalog** (head office, `menu.manage` writes): categories; items with kind, category,
  price, cost; an item's sizes editor; its modifier groups; modifier groups with their options
  (price, price by size, default, active). Add/edit dialogs; retire instead of delete.
- **Menu › Offers**: deals list and dialog (kind, code, value, category, size, minimum, days,
  channels, dates, active).
- **Menu › Branch menu**: pick a branch; every item, size and option with the branch price (editable,
  `menu.manage`) and an available switch (86, `kitchen.operate`).
- **Order Taking**: branch picker, channel (delivery · carryout · dine-in), **caller ID** (phone →
  name, saved addresses, recent orders with one-tap reorder), the menu grid by category, the **item
  builder** (size; toppings by whole/left/right and light/regular/extra; choices; quantity; note), the
  cart priced by `POST /restaurant/pos/quote` on every change (errors shown inline), coupon, tip,
  payment method, **Place order** (`orders.take`) → order number and ready time.
- **Kitchen & Dispatch › Kitchen**: four columns — New, Making, Oven, Ready — each ticket with number,
  channel, age (warning past the quote), lines and toppings, notes, and one bump button to the next
  stage; Cancel with a reason. Refreshes every 10 seconds.
- **› Dispatch**: ready delivery orders with a driver picker and **Send out**; out-for-delivery orders
  with **Delivered**; drivers' status.
- **› Drivers**: add, rename, activate, set off/available.
- **Network › branch page › Service**: the branch's service settings (accepting switches, tax rate,
  delivery fee and minimum, postal codes, prep and delivery minutes, capacity, half-topping pricing,
  hours per weekday) with **Save** on `branch.manage`.

## Rules kept

Writes through `services/restaurant-actions.ts` / `services/restaurant-os-actions.ts`, each in
`lib/action-permissions.ts`; prices are always the backend's; pure helpers in `lib/restaurant-os.ts`
(cart building, portion labels, stage columns, next stage, ticket age) unit-tested in
`tests/restaurant-os.test.ts`; docs: Menu doc updated, new Order Taking and Kitchen & Dispatch docs.

## Acceptance criteria

1. Every new write gated by role; registries and docs tests pass.
2. `npm test`, `npx tsc --noEmit`, `npm run build` pass.
3. Manual: build a menu; order at the POS with caller ID; bump through the kitchen; dispatch and
   deliver; order online and follow the tracker — checked against a local backend.

## Verification (2026-10-15)

AC 1 done (`tests/role-gate-coverage.test.ts`, `tests/docs.test.ts`, `tests/query-registries.test.ts`)
· 2 done (2,724 tests, type-check and build green) · 3 done against a local demo backend: menu catalog,
POS, kitchen (four columns, bumps), dispatch (driver out, collect cash), the storefront through the
pizza builder, and the live tracker.

## Patches

- 2026-10-15: an included topping shows "extra +price" (or nothing), not "+price" — it is free as it comes.
