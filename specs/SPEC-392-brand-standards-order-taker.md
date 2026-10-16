# SPEC-392 — Brand Standards screens and the Order Taker chat

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-411, SPEC-412 · **Plan:**
backend SPEC-401 (W10)

## Brand Standards (`/standards`)

**Record a visit** (`network.manage`): branch, date, the 18 checklist points grouped by section with
Pass / Fail / Not seen and a note on a failure; Save is enabled only when every point is answered
(`lib/standards.ts`). The page lists each branch's latest score and grade, days since its last visit and
**Visit due**; the open corrective actions, overdue first, each with **Done**; every visit with its
section scores. Employee `brand_standards` (a shield with a tick), nav "Brand Standards" (ShieldCheck),
doc `standards`.

## The Order Taker

- **The switch**: Network › Settings gains **Order by chat** (a switch; `setOrderTaker`, `network.manage`,
  the role's reason shown when it may not).
- **The chat**: on the brand's ordering page, when the brand payload says `orderTaker`, the cart column
  offers **Order by chat** (`features/storefront/order-taker-chat.tsx`). The browser keeps the
  conversation (`chatOrderTaker`); a proposal shows the engine's lines and subtotal and **Use this
  order**, which adds them to the cart (`lib/order-taker.ts` `proposalToCart`); the guest checks out as
  usual. At most 20 messages of 500 characters.
- The Network doc's Settings section describes the switch.

## What FOC sees (Rule 12)

Nothing — restaurant brands only; the chat is off until head office turns it on.

## Verification (2026-10-16)

`tests/standards-order-taker.test.ts` (2); pins updated (`navigation`, `employee-character`,
`query-registries`, `docs`, `role-gate-coverage`). Full suite 2775 passed, `tsc` clean, lint 0 errors,
build lists `/standards`. Backend behaviour: `tests/test_restaurant_standards.py`,
`tests/test_restaurant_order_taker.py`.
