# SPEC-320 — Pricing page and the plan journey from the marketing site

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-28
**Programme:** `SPEC-311-saas-platform-master.md` (onboarding, SPEC-313) · owner request
**Backend contract:** backend SPEC-314 — `GET /plans` (public: `key`, `name`, `band_label`,
`price_cents`, `currency`, `interval`, `ai_allowance_cents`), `POST /billing/subscription`.
**Marketing site:** `ecommerce-fte/specs/SPEC-016-pricing-in-the-app.md` (its "Pricing" links here).

## Why

The owner: a visitor on the marketing site clicks Pricing, lands on a professional pricing page in
the app, picks a plan, and goes through the sign-up and onboarding the app already has — with the
plan remembered in the URL the whole way, so they never pick it twice.

## Behaviour

**`/pricing`** — public (no sign-in), in the marketing site's identity (paper, ink, brand red, the
display serif, mono labels, square-cornered buttons), light and dark:
- **No header or navbar** (owner, 2026-09-28): the page opens straight on the pricing hero. The
  way on is on the page itself: the plan cards' "Choose this plan", the closing band's
  "Get started" / "Sign in" (or "Open the app"), and the footer's legal links.
- "[ Pricing ]", **"One price for your whole store."**, and the line: priced by your store's
  annual revenue; every plan includes everything.
- The three plans from `GET /plans` (never hard-coded): band, price per month, "Includes $N of AI
  every month", "Everything included", and **Choose this plan** →
  - not signed in: `/signup?plan=<key>`;
  - signed in: `/onboarding?plan=<key>` (onboarding ignores it once the plan step is done).
- "Every plan includes": every connection under one login (synced every 15 minutes), Glisp,
  the AI employees, your team with roles, your brand (logo and login screen), and AI included
  with the option to use your own AI keys — each true of the product today.
- "How it starts": choose a plan → create your account and connect Shopify → your last 30 days
  sync in minutes. "No card needed to start." (payment is a preview, D5).
- If `/plans` cannot be read, the page still renders with a calm "Plans are unavailable right
  now" and a Get started link — never an error page.

**The plan travels:**
- `?plan=<key>` is kept in the URL: `/signup?plan=` → `/verify?email=…&plan=` → `/onboarding?plan=`.
- Because Google/Shopify sign-in leaves the site and returns without it, `proxy.ts` also remembers a
  valid `?plan=` in a short-lived cookie `fte_plan` (30 days, not secret, not httpOnly) on any page
  it gates.
- Sign-up shows the chosen plan above the form — "Your plan · $3M – $30M · $800/month · Change"
  (→ `/pricing`).
- Onboarding's plan step opens with that plan selected and its confirm panel showing: one click,
  "Start this plan". Starting a plan clears the cookie. An unknown key is ignored.

## How

- `lib/pricing.ts` (pure): `PLAN_COOKIE`, `validPlanKey`, `choosePlanHref(key, signedIn)`,
  `onboardingPath(plan)`, `pickPlan(url plan, cookie plan, plan keys)`, `INCLUDED` (the feature
  list), `HOW_IT_STARTS`.
- `lib/auth-flows.ts`: `destinationAfterSignIn(hasOrg, next, plan)` → `/onboarding?plan=` when the
  account has no organization; `features/auth/after-sign-in.ts` passes the current URL's plan.
- `proxy.ts`: `/pricing` is an open route; the plan cookie is set on the response of any gated page
  carrying a valid `?plan=`.
- `app/pricing/layout.tsx` (the display serif), `page.tsx` (server: `GET /plans`, the session
  cookie for the CTA), `features/pricing/*`.
- `app/(auth)/signup/page.tsx` + `features/auth/signup-form.tsx` (banner, plan into `/verify`);
  `app/onboarding/page.tsx` + `features/onboarding/plan-step.tsx` (`initial`, cookie cleared).
- Colours: the `--showcase*` tokens (the marketing identity, SPEC-312 Patches), both themes.

## Tests

Vitest (`tests/pricing.test.ts`): plan-key validation; CTA href signed in / out; onboarding path;
pick order (URL over cookie, unknown ignored); destination after sign-in with and without a plan
and an organization. Existing auth-flow tests stay green. `npm test`, `npx tsc --noEmit`, `npm run
build`. Manual: marketing Pricing → `/pricing` → Choose $3M–$30M → sign-up shows it → verify →
onboarding: name the company → the plan is preselected → Start → connect Shopify; the same through
"Continue with Google"; signed in, `/pricing` → Choose goes to onboarding; light and dark; phone.

## Acceptance criteria

- [x] `/pricing` is public, in the marketing identity, and reads the plans from the backend.
- [x] The chosen plan is kept in the URL through sign-up and verify, and survives Google/Shopify.
- [x] Onboarding opens on the chosen plan; nobody chooses twice.
- [x] Every sentence on the page is true of the product today.
- [x] Tests, type-check and build green.

## Verification (2026-09-28)

`npm test` 2,113 passed (9 new in `tests/pricing.test.ts`, existing auth-flow tests unchanged and
green); `npx tsc --noEmit` clean; eslint clean on every touched file; `npm run build` green.
Screenshots: `/pricing` (plans read live from `GET /plans`: $500 · $800 · $1,200 a month with
$50 · $80 · $120 of AI) and `/signup?plan=3m_to_30m` showing "Your plan · $3M – $30M · $800/month ·
Change". The end-to-end pass through verify and onboarding needs a new account, which writes to the
database — it runs on the first real sign-up, not from here.

## Patches

- 2026-09-28: **No navbar on the pricing page (owner).** The sticky `Header` (logo, Product,
  Pricing, Sign in, Get started) is removed from `features/pricing/pricing-view.tsx`, along with
  its `BrandLogo` import. Nothing else on the page changes.
