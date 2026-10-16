# SPEC-399 — Use your points at online checkout

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-419 · **Extends:** SPEC-383

## What

The storefront checkout (`/order/<slug>`) gains a **Use your points** block when the brand's program is
on, under the gift card:

1. "Email me a code" sends a code for the phone typed above (`requestLoyaltyCode` →
   `POST /storefront/{slug}/loyalty/code`). The guest is told: "If this phone belongs to a member with an
   email on file, a code is on its way" — the same words whatever the answer, matching the backend.
2. A code box and **Confirm** (`verifyLoyaltyCode` → `/loyalty/verify`). A right code shows the
   member's points and the rewards, with the ones they cannot afford disabled.
3. Choosing a reward adds `rewardId` and `loyaltyToken` to the quote and the order, so the price shows the
   reward before paying. "Don't use a reward" clears it. Once the guest has proved they are a member, the
   "Join" box is hidden and the order no longer asks to join.

The session lives 30 minutes (`expiresAt` kept in the browser from `expiresIn`); after it, or when the
phone changes, the block returns to step 1 and the reward leaves the order. The pure half is
`lib/loyalty-online.ts` (`pointsStep`, `sessionLive`, `rewardOptions`), unit-tested. Both new writes are
public, registered as `member` like every storefront write.

## What FOC sees (Rule 12)

Nothing — restaurant storefronts only.

## Acceptance criteria

1. The three steps work against the backend; a wrong code shows its refusal; a 503 or 429 shows its
   message.
2. A chosen reward is priced in the quote and placed with the order; changing the phone or the session
   ending drops it.
3. tsc, lint, tests and build green.

## Manual verification checklist

- On a demo storefront with a member who has an email: type the phone, Email me a code, read it from the
  backend log or outbox, Confirm, pick a reward → the cart shows the discount; place → the member's points
  fall by the reward's points.

## Verification (2026-10-16)

AC 1 done (local demo with a STARTTLS mail sink: Email me a code delivered "rewards code 336890"; a wrong
code showed "That code is not right or has expired."; the right one listed Free soda · 30 points and
$20 off · 500 points, the second disabled with "(you have 50)") · AC 2 done (choosing Free soda priced
the cart −$2.50 to $6.96 before paying; the order placed and the member's points fell from 50 to 20;
changing the phone returned the block to "Email me a code"; once proved, the Join box is hidden) ·
AC 3 done (`tests/loyalty-online.test.ts` 4 tests; `npm test` 2790 passed; `tsc`, lint and
`npm run build` clean).
