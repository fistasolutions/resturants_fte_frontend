# SPEC-321 — Paying for the plan: Stripe Checkout in onboarding

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-28
**Backend contract:** backend `SPEC-322-stripe-checkout.md` — `GET /plans` → `payment:
{provider: "stripe" | "preview", test_mode}`; `POST /billing/checkout {plan_key}` → `{url}`;
`POST /billing/checkout/confirm {session_id}` → `{subscription}` (404 `checkout_not_found`, 409
`checkout_not_paid`, 502 `payment_unavailable`); the dummy `POST /billing/subscription` → 409
`checkout_required` when Stripe is on.
**Follows:** SPEC-313 (onboarding), SPEC-320 (pricing and the plan journey).

## Behaviour

- **The plan step, with Stripe on:** the chosen plan's panel says "You'll pay on Stripe's secure
  checkout page, then come straight back to connect your store." and its button is **Continue to
  payment** — the browser goes to Stripe. In test mode a line adds: "Test mode: card 4242 4242 4242
  4242, any future date, any CVC." With Stripe off, the step is exactly as before (Start this plan,
  no card).
- **Stripe's cancel** returns to `/onboarding?plan=<key>&checkout=cancelled`: the plan is still
  selected and a note says "Payment cancelled — nothing was charged."
- **Stripe's success** returns to `/onboarding/billing?session_id=…`: "Confirming your payment…",
  one confirm call; on success the remembered plan is forgotten and onboarding continues (connect
  Shopify). If the payment is still settling (`checkout_not_paid`) it asks again, up to 5 times, 2
  seconds apart, then says it is still processing with **Check again**. Any other failure: the
  backend's message and **Back to plans**. A missing session id goes straight back to onboarding.
- **Honest wording about cards** (SPEC-320's page said "No card needed to start"): the pricing page
  says "Secure checkout by Stripe" when Stripe is on and "No card needed to start" only in the
  preview. Its closing steps say "Choose your plan and pay" when Stripe is on.

## How

- `lib/onboarding.ts`: `PaymentMode`, `paymentMode(api)` (a missing `payment` = preview).
- `lib/checkout.ts` (pure): `checkoutReturnState(code, attempt)` → `retry | processing | failed |
  done`, `MAX_CONFIRM_ATTEMPTS`, `CONFIRM_RETRY_MS`.
- `services/onboarding.ts`: `startCheckout(planKey)` → url; `confirmCheckout(sessionId)`.
- `features/onboarding/plan-step.tsx` (payment mode, cancelled note), `app/onboarding/page.tsx`
  (passes both), `app/onboarding/billing/page.tsx` + `features/onboarding/checkout-return.tsx`.
- `features/pricing/pricing-view.tsx` + `app/pricing/page.tsx`: the chip and step wording by mode.

## Tests

Vitest: `paymentMode` (stripe, test mode, missing → preview); `checkoutReturnState` (success, retry
until the limit then processing, other codes fail). `npm test`, `npx tsc --noEmit`, `npm run build`.
Manual (test mode): choose a plan → Continue to payment → Stripe → 4242… → back → "Confirming…" →
connect Shopify; cancel on Stripe → back with the note; with Stripe off, the old one-click start.

## Acceptance criteria

- [x] With Stripe on, onboarding continues only after payment; with Stripe off, nothing changes.
- [x] Cancel and success both come back to the right place, with the plan remembered.
- [x] Every sentence about cards and payment is true in the mode in force.
- [x] Tests, type-check and build green.

## Verification (2026-09-28)

`npm test` 2,118 passed (new: `tests/checkout.test.ts`, SPEC-321 cases in `tests/pricing.test.ts`);
`npx tsc --noEmit` clean; eslint clean; `npm run build` green. `/pricing` screenshot against the
running backend shows "Secure checkout by Stripe". The end-to-end payment with card 4242… needs a
new account (a database write) and runs on the first real sign-up.
