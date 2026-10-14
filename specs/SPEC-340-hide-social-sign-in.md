# SPEC-340 — Email and password only on the sign-in screens (Google / Shopify hidden)

**Status:** implemented 2026-10-06 · **Repo:** frontend only · **Builds on:** SPEC-312
(Continue with Google / Shopify)

## Why

Owner (2026-10-06): for now people sign in and sign up with **email and password only**;
"Continue with Google" and "Continue with Shopify" are hidden **by default**. Google sign-in
also fails today until its redirect URI is registered, and Shopify sign-in needs the Shopify
app's distribution settled first — neither should be offered to a first client yet.

## What changes

- `lib/auth-providers.ts` (pure): `socialSignInEnabled(value)` is `true` only for the string
  `"true"`; `SOCIAL_SIGN_IN` reads `NEXT_PUBLIC_SOCIAL_SIGN_IN` at build time. Unset = hidden.
- `features/auth/login-form.tsx` and `features/auth/signup-form.tsx` draw `ProviderButtons` and
  the "or" divider only when `SOCIAL_SIGN_IN` is on. The invitation page reuses these forms, so
  it follows.
- `.env.example` documents `NEXT_PUBLIC_SOCIAL_SIGN_IN=false`.
- Nothing is deleted: `ProviderButtons`, the callback pages and the backend's provider routes
  are untouched (owner: "frontend only, for now"). Setting the variable to `true` and
  redeploying brings both buttons back. Accounts that already signed up with Google or Shopify
  keep working through "Forgot password", which sets a password for them.

## Acceptance criteria

1. With the variable unset (or anything but `true`), login and sign-up show only the email form
   — no provider buttons, no divider.
2. With `NEXT_PUBLIC_SOCIAL_SIGN_IN=true`, both screens look exactly as before.
3. `npm test`, `npx tsc --noEmit`, lint on touched files and `npm run build` green.

## Manual verification checklist

- `/login` and `/signup`: only Email / Password (and Name on sign-up), no "or".
- `/invite/<token>`: same.

## Verification (2026-10-06)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Unset → only the email form | done | production build served locally: `/login` and `/signup` HTML contain no "Continue with Google" / "Continue with Shopify", one email field each |
| 2 | `true` → as before | done | `tests/auth-providers.test.ts` — only the exact string `true` turns it on; the forms render the unchanged `ProviderButtons` + divider then |
| 3 | test / tsc / lint / build | done | `npm test` 206 files, **2,301 passed**; `npx tsc --noEmit` clean; ESLint clean on touched files; `npm run build` compiled successfully |

## Patches

### 2026-10-06 — Google back, Shopify still hidden

Owner: "unhide the Continue with Google button, Shopify remains hidden". One switch per
provider instead of one for both:

- `lib/auth-providers.ts`: `signInProviders(google, shopify)` (pure) → `{ google, shopify, any }`.
  **Google is on unless** `NEXT_PUBLIC_GOOGLE_SIGN_IN` is exactly `false`; **Shopify is off
  unless** `NEXT_PUBLIC_SHOPIFY_SIGN_IN` is exactly `true`. `SIGN_IN_PROVIDERS` reads both at
  build time. `NEXT_PUBLIC_SOCIAL_SIGN_IN` is retired.
- `ProviderButtons` draws only the providers that are on; the login and sign-up forms draw it
  and the "or" divider when `any` is on (the invitation page follows, as before).
- `.env.example` documents both variables.

Acceptance: with neither variable set, login and sign-up show **Continue with Google**, the
divider, then the email form — no Shopify button; `NEXT_PUBLIC_SHOPIFY_SIGN_IN=true` brings
Shopify back; `NEXT_PUBLIC_GOOGLE_SIGN_IN=false` hides Google (and the divider when both are
off). Google sign-in needs its redirect URI registered in Google Cloud to complete.
