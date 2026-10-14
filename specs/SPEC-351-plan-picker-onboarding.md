# SPEC-351 — Onboarding's Plan step uses the pricing page's dropdown; no AI dollar figures

**Status:** implemented 2026-10-07 · **Repo:** frontend · **Builds on:** SPEC-326 (the pricing
page's one card with the revenue dropdown), SPEC-320/321 (plan remembered from /pricing,
Stripe checkout), backend SPEC-359 (checkout recovery)

## Why

Owner (2026-10-07), on the onboarding Plan step's three stacked cards: "I want the pricing the
same way, a dropdown like on the pricing page." And: "no need to mention the AI $200 — say
something relevant, but don't mention the dollars." The AI allowance figures are odd side by
side ($200 for the smallest band, $80 for the middle one). They read as a price list for AI
rather than as what the plan includes.

## What changes

1. **One picker for both places.** `features/pricing/plan-choice.tsx` (`PlanChoice`) holds:
   - the annual-revenue `Select`: the plan name and band in the trigger, and each option with
     its price;
   - the price, large, with its interval;
   - the cost a day;
   - the AI line.

   The pricing page's `PlanPicker` and the onboarding `PlanStep` both render it. Their actions
   differ: "Choose this plan" links to sign-up on /pricing; Continue to payment or Start this
   plan in onboarding.
2. **The AI line has no dollar figure** anywhere a plan is chosen:
   - the pricing page;
   - onboarding;
   - Settings → Billing's plan list.

   It reads "Glisp and every AI employee, with a monthly AI allowance included"
   (`AI_INCLUDED` in `lib/pricing.ts`). `PlanCard.aiAllowance` stays in the data for the
   billing meter; it is no longer printed next to a plan.
3. **"Every plan includes"** — the five lines the pricing card lists (`YOU_GET`, moved to
   `lib/pricing.ts` so both use one list) — shows under the onboarding picker, compact.
4. **Onboarding behaviour is unchanged otherwise.** The plan from /pricing opens selected, and
   without one the first band is selected, as on /pricing. The cancelled-checkout notice, the
   test-mode card hint, Stripe checkout (or the preview's no-card start) and the error alert all
   stay. The confirm button names the choice: "Continue to payment — $800/month".

**What FOC sees (Rule 12):** unchanged. FOC is subscribed and never sees the Plan step. Its
Settings → Billing plan list loses the AI dollar figure the same as every organization's, as the
owner asked.

## Acceptance criteria

1. Onboarding's Plan step shows the dropdown, the price, the cost a day and the AI line, and the
   confirm starts checkout (Stripe) or the plan (preview) for the selected band.
2. No "$… of AI" text remains on /pricing, onboarding or Settings → Billing's plan list.
3. A plan remembered from /pricing opens selected.
4. `npm test`, `npx tsc --noEmit`, lint on the touched files and `npm run build` are green.
   Backend integration: `GET /billing/plans`, `POST /billing/subscription` (preview) and
   `POST /billing/checkout` (Stripe) pass their suites, including SPEC-359.

## Manual verification checklist

- `/onboarding` on the plan step: pick each band. The price, cost a day and button label
  follow; Continue opens Stripe in test mode.
- `/pricing`: the same dropdown, now without "$… of AI".
- Settings → Billing → change plan: no AI dollar figure next to a plan.

## Patches

- 2026-10-07 — **Onboarding, tightened (owner, with screenshots).**
  1. **"Up to", not "Under".** The first band's label reads "Up to $3M annual revenue", like
     its name. The catalogue is the source: backend SPEC-314 Patches and migration `0156`. (A
     first reading of this point as "open on the band above $3M" was undone the same day: the
     step opens on the plan chosen on /pricing, else the first band, as /pricing does —
     `defaultPlanKey`.)
  2. **"Every plan includes"** is removed from onboarding; /pricing keeps its "You get" column.
  3. **No Stripe explanation line.** The test-card hint shows only when the backend reports
     Stripe test mode (`payment.testMode`), so with live keys it never appears. The preview's
     no-card note stays, since it is only shown without Stripe.
  4. **No cost a day on onboarding,** and the price and the AI line are centred.
     `PlanChoice` takes `perDay` (default on) and `align` (default `start`); /pricing is
     unchanged.
