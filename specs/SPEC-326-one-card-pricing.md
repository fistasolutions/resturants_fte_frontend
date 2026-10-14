# SPEC-326 — Pricing: one card on the red band

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-29
**Owner decision (2026-09-29):** design #4 "Red band" of the five one-card pricing mockups. "Just
update the UI": every link, URL and the plan's journey stay as they are.

## Behaviour

- **The top of `/pricing` is now the brand's red band:**
  - the `[ Pricing ]` label;
  - the headline "Priced by your size. Nothing held back.";
  - the line "One plan per revenue band. Every feature in every plan."
- **One card sits lifted over the band's lower edge, replacing the three plan cards:**
  - **Left side:**
    - "Your store's annual revenue", the design-system dropdown (Radix Select, not the browser's), one
      option per plan from `GET /plans`, each with its price;
    - the price in the display serif;
    - "$X a day · $Y of AI included monthly";
    - a red "Choose this plan" button.
  - **Right side:** "You get", five lines true of every plan.
- **The first plan is preselected**, and changing the dropdown updates the card in place.
- **"Choose this plan" goes to `choosePlanHref(plan.key, signedIn)`**, exactly where each plan's card
  went: `/signup?plan=…` for a visitor, `/onboarding?plan=…` when signed in. The remembered-plan cookie
  and the onboarding preselection are untouched.
- **The payment chips** (card / secure checkout wording from `pricingChips`) sit centred under the card.
- **Unchanged:** the "Every plan includes" grid, "How it starts", the closing band, the footer, the
  metadata, and the failed-plans fallback (now shown as a card on the band).
- **The daily cost** is `perDay(monthly cents, currency)` in `lib/onboarding.ts`: the monthly price ×
  12 ÷ 365, two decimals, in the plan's currency. It is added to `PlanCard` as `perDay`, an additive
  field.
- **Phone:** the card stacks (revenue and price first, then "You get") and the band's headline wraps.

## Tests

- `tests/onboarding.test.ts`: `perDay` ($500 → $16.44, $800 → $26.30, $1,200 → $39.45) and `planCards`
  carrying it.
- The existing pricing tests (`choosePlanHref`, `pickPlan`, chips, steps) are unchanged and pass.
- `npm test`, `tsc`, lint, build.

## Manual verification

- `/pricing` as a visitor: pick each revenue; the price, per-day and AI lines change; the button leads
  to `/signup?plan=<key>`.
- Signed in, the button leads to `/onboarding?plan=<key>` and the plan step is preselected.
- 360 px width and both themes.
