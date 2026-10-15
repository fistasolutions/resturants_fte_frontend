# SPEC-380 — Payments and cash screens: the franchise's Stripe account, card online, tenders, refunds, the drawer and the day close

**Status:** implemented 2026-10-15 · **Repo:** frontend · **Backend:** SPEC-395 · **Builds on:**
SPEC-379 (Restaurant OS screens), SPEC-377 (network screens), SPEC-358 (role gates), SPEC-229 (docs)

## Why

OS-1 took orders but not money. These are the screens where a franchise connects its own Stripe
account, guests pay by card online, the counter and the door take cash or card, managers refund, and
every branch closes its day with a counted drawer.

## Screens

- **Network › franchisee page › Payments** (a panel under the franchisee's figures): connected or
  not, test/live, the publishable key, the webhook URL to paste into Stripe (copy button), last
  checked. A form takes the publishable key, the secret key and the webhook signing secret (secrets
  are write-only: the form never shows a stored one). **Connect / Save** and **Disconnect** on
  `payments.manage`.
- **Online ordering** (`/order/[slug]`): when the branch's menu says `card_online`, checkout offers
  **Pay now by card**; placing the order goes to Stripe's hosted page (`checkout_url`). Cash, card on
  delivery and pay at the store stay.
- **Tracker** (`/track/[token]`): an order at `awaiting_payment` reads "Waiting for your card payment"
  (an unpaid order is cancelled after 30 minutes) with no progress steps; after `?paid=1` it reads
  "Payment received — confirming with the store…" until the backend confirms, refreshing every 5
  seconds while it waits (20 otherwise). A card order cancelled unpaid says the guest was not
  charged. The order card shows how it is paid and whether it is paid.
- **Order Taking** gains two tabs: **New order** (as before) and **Orders**.
  - **New order:** payment is **Cash now** (amount given → change shown before placing), **Card now**
    (taken at the counter), or pay later (cash at the door, card at the door, pay at the store). Cash
    now refuses too little cash before the request.
  - **Orders:** the branch's day (date picker, search by number, phone or name): number, time,
    channel, guest, total, stage, payment status and refunds. A row opens the order: lines, payments,
    refunds; **Take payment** (cash with change, or card) on an unpaid order (`orders.take`);
    **Refund** (amount, reason) on a finished or cancelled paid order (`orders.refund`).
- **Kitchen & Dispatch:** finishing an unpaid order (Picked up / Delivered) asks how it was paid:
  **Paid cash** or **Paid card** buttons replace the single bump (`kitchen.operate`).
- **Cash & Day Close** (new sidebar destination `/cash`, `cash.manage`): branch picker and date; the
  drawer (float, cash sales, paid in, paid out, refunds, drops, expected cash; counted and variance
  once closed); **Open drawer** with a float; **Paid in / Paid out / Drop** (amount, note — a paid out
  needs one); **Close the day** (counted cash, notes) and **Reopen**; the day report (orders, gross,
  discounts, refunds, net sales, tax, tips, delivery fees, voids, open orders; by channel; by tender).

## Rules kept

Writes in `services/restaurant-os-actions.ts` (`connectPayments`, `disconnectPayments`, `payOrder`,
`refundOrder`, `openDrawer`, `recordDrawerMovement`, `closeDrawer`, `reopenDrawer`; `advanceOrder`
takes a tender), each in `lib/action-permissions.ts`; reads in `lib/queries/restaurant.ts`
(`paymentAccount`, `dayOrders`, `orderDetail`, `cashDay`); pure helpers in `lib/restaurant-os.ts`
(`changeDue`, `needsTender`, `paymentLabel`, `drawerLines`, `refundable`, `POS_TABS`) unit-tested in
`tests/restaurant-os.test.ts`. Docs: Order Taking, Kitchen & Dispatch, Network updated; new **Cash &
Day Close** doc.

## What FOC sees (Rule 12)

Unchanged — restaurant routes and screens only, behind the `restaurant` feature.

## Acceptance criteria

1. Every new write gated by role; registries, docs and nav tests pass.
2. `npm test`, `npx tsc --noEmit`, `npm run build` pass.
3. Manual against a local backend: connect a test Stripe account; take cash with change at the POS;
   finish an unpaid delivery with a tender; refund an order; open, move, close and reopen the drawer
   and read the day report.

## Verification (2026-10-15)

AC 1 done (`tests/role-gate-coverage.test.ts`, `tests/query-registries.test.ts`, `tests/docs.test.ts`;
new helpers in `tests/restaurant-os.test.ts`) · 2 done (2,733 tests, `npx tsc --noEmit`, `npm run
build`) · 3 done against a local demo backend: the franchise's Card payments panel; cash change shown
before taking it; a closed drawer refusing cash; paid by card; a full card refund; Cash & Day Close
reconciling (float 150 + 45.02 − 12.50 − 100 − 2 = 80.52) and closing short 1.52; the kitchen's
Picked up · paid cash / Paid card on an unpaid ready ticket. Stripe's hosted page itself needs a real
test account and was not opened.
