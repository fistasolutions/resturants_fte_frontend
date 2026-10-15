# SPEC-383 — Loyalty and gift card screens

**Status:** implemented 2026-10-15 · **Repo:** frontend · **Backend:** SPEC-398 · **Builds on:**
SPEC-379/380 (Restaurant OS and payments screens), SPEC-358 (role gates), SPEC-229 (docs)

## Why

The brand's points program and its gift cards need a home, and the counter, the kitchen and the
online store need to use them without slowing anyone down.

## New destination: **Loyalty & Gift Cards** (`/loyalty`, `network.view`)

Tabs:
- **Program** — on/off, the program's name, points per unit spent, welcome points (**Save** on
  `loyalty.manage`, head office); the rewards list with add/edit (name, points, amount off or free
  item, active) on `loyalty.manage`; members and points outstanding.
- **Members** — search by name, phone or email; a member opens their points and ledger; **Adjust
  points** (points, reason) on `loyalty.adjust`.
- **Gift cards** — search by last four, filter by status; head office sees the count and the money
  still on cards; a card opens its transactions; **Disable / Enable** and **Adjust balance** on
  `gift_cards.manage`.
- **Settlement** (head office) — a date range; per franchisee: sold, redeemed, net; totals and the
  brand's outstanding balance.

## Order Taking

- **Caller panel:** a member shows their points and the rewards, each **Use** when they have the points
  (the cart is re-priced with the reward; **Remove** takes it off); a known guest who is not a member,
  or a new caller, gets **Join rewards** (`orders.take`).
- **Payment:** a **Gift card** choice with the code — it pays what it holds; when it does not cover
  everything the rest is taken in cash or card on the Orders tab or at the door.
- **Sell a gift card** (a dialog from the New order tab, `orders.take`): amount, cash (with change) or
  card, recipient; the code is shown once with a copy button, then only its last four exist anywhere.
  **Reload** takes a code and an amount.
- **Orders tab:** an order shows what is still due; **Take payment** gains **Gift card** (code).

## Kitchen & Dispatch

An unpaid order finished at the door can be paid with a gift card (code) besides cash or card.

## Online ordering and tracker

- A **Gift card** field with **Check balance**; the card pays what it holds and the rest is paid as
  chosen (card online pays only the rest).
- When the program is on: **Join {program name}** (earn points on this order) with the welcome points
  shown. Rewards are not redeemed online (backend SPEC-398).
- The tracker shows the points the order earned once it is finished.

## Cash & Day Close

The drawer lists **Gift card sales** (cash); the day report shows gift cards sold (and in cash).

## Rules kept

Writes in `services/restaurant-os-actions.ts` (`saveLoyaltyProgram`, `createReward`, `updateReward`,
`adjustPoints`, `enrollGuest`, `sellGiftCard`, `reloadGiftCard`, `lookUpGiftCard`,
`setGiftCardStatus`, `adjustGiftCard`) and `services/storefront-actions.ts`
(`checkPublicGiftCard`), each in `lib/action-permissions.ts`; reads in `lib/queries/restaurant.ts`
(`loyalty`, `members`, `member`, `giftCards`, `giftCard`, `settlement`); pure helpers in
`lib/loyalty.ts` (tabs, labels, reward description, gift card code formatting, settlement totals)
unit-tested in `tests/loyalty.test.ts`; docs: new **Loyalty & Gift Cards** doc; Order Taking, Cash &
Day Close updated.

## What FOC sees (Rule 12)

Unchanged — restaurant screens only, behind the `restaurant` feature.

## Acceptance criteria

1. Every write gated by role; registries, docs and nav tests pass.
2. `npm test`, `npx tsc --noEmit`, `npm run build` pass.
3. Manual against a local backend: set up the program and two rewards; join a caller and redeem a
   reward at the POS; sell a gift card and pay part of an order with it; read the settlement.

## Verification (2026-10-15)

AC 1 done (`tests/role-gate-coverage.test.ts`, `tests/query-registries.test.ts`, `tests/docs.test.ts`;
`tests/loyalty.test.ts` for the pure half) · 2 done (2,742 tests, `npx tsc --noEmit`, `npm run
build`) · 3 partly by hand against a local demo backend: the Program tab with two rewards and the
counts; a member looked up at the POS showing 25 points with both rewards disabled until affordable.
The gift-card, refund, settlement and online flows are covered end to end by the backend's
`test_restaurant_loyalty.py`; their screens were type-checked and built but not clicked through.
