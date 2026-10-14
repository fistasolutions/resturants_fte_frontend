# SPEC-344 — Install from Shopify: the browser side

**Status:** implemented 2026-10-06 · **Repo:** frontend · **Backend:** SPEC-352
(`SPEC-352-install-from-shopify.md`) · **Builds on:** SPEC-315/316 (onboarding connect and
sync), SPEC-342 (no store → onboarding)

## Why

A merchant who clicks **Install** in Shopify must go straight to Shopify's approval screen, then
into our sign-up with their store already approved — never a login screen first (Shopify review).

## What changes

- **The launch** — `proxy.ts`: any page reached with Shopify's launch query (`shop` + `hmac` +
  `timestamp`, and no `code`/`state`, which belong to OAuth returns) is forwarded, query intact,
  to `/api/shopify/install`. Decided by the pure `isShopifyLaunch` in `lib/shopify-install.ts`.
- **`app/api/shopify/install/route.ts`** (GET): posts the query to backend `/shopify/install/start`;
  `authorize` → redirect to Shopify; `open` → `/` (the app, or sign-in); an error →
  `/shopify-install?reason=…`.
- **`app/api/shopify/install/callback/route.ts`** (GET, the redirect URI): Shopify's Cancel →
  `/shopify-install?reason=cancelled`; otherwise posts the query to `/shopify/install/complete`.
  - **Signed in:** claims at once (`/stores/install/claim`) → `/`; when the claim cannot be made
    yet (no company, or another store) the claim is kept for onboarding.
  - **Not signed in:** the claim goes into an httpOnly, `SameSite=Lax`, 7-day cookie
    (`ftes_shopify_install`, `{claim, shop}`) and the browser goes to `/signup`.
  - No token, claim or code ever reaches page script.
- **`app/api/shopify/install/claim/route.ts`** (POST): reads the cookie, claims with the session,
  deletes the cookie, returns `{ok}` or the backend's words.
- **Onboarding, connect step:** with the cookie present, `/onboarding` shows
  `InstallClaimStep` — "Finish connecting `<shop>` — Shopify has already approved it" with one
  button — above the ordinary connect form.
- **`/shopify-install`** (open route): a plain page that says what went wrong
  (`installProblemText`) with links to try again and to sign in.

## Acceptance criteria

1. `isShopifyLaunch` is true only for a launch query; an OAuth return or an ordinary page is not.
2. A launch on `/` reaches `/api/shopify/install` with its query.
3. The claim cookie is httpOnly and parsed defensively (`readInstallCookie`).
4. `npm test`, `npx tsc --noEmit`, lint on touched files, `npm run build` green.

## Manual verification checklist

- Install the public app on a development store from Shopify → Shopify's approval screen →
  approve → sign-up → onboarding shows "Finish connecting" → the first sync starts.
- Open the installed app from the Shopify admin → the app (or sign-in).

## Verification (2026-10-06)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `isShopifyLaunch` only for a launch | done | `tests/shopify-install.test.ts` (launch, OAuth return with `code`/`state`, ordinary and partial queries) |
| 2 | A launch on `/` reaches the install route and Shopify | done | Built app (`next start`) + backend on a throwaway PostgreSQL with test app keys: a correctly signed launch on `/` → 307 `/api/shopify/install` → 307 `https://<shop>/admin/oauth/authorize` with the public client ID, 16 scopes, `redirect_uri …/api/shopify/install/callback` and a state. A forged launch → `/shopify-install?reason=failed`; a 2-hour-old one → `reason=expired`; Cancel → `reason=cancelled`; each page shows its words and both buttons. An OAuth return (`code` + `state`) is not forwarded |
| 3 | Claim cookie httpOnly, parsed defensively | done | set with `cookieBase` (httpOnly, Lax); `readInstallCookie` refuses missing/malformed/tampered values (tests). End to end: a signed-in owner with a pending install → `POST /api/shopify/install/claim` 200, the store is created on the `public` app, `connected`, first sync running; the same claim again 410 |
| 4 | test / tsc / lint / build | done | `npm test` **2,321 passed**; `npx tsc --noEmit` clean; ESLint clean on every touched file; `npm run build` compiled (routes `/api/shopify/install`, `/callback`, `/claim`, `/shopify-install`) |
