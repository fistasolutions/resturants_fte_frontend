# SPEC-339 — The login screen stops remembering the last organization

**Status:** implemented 2026-10-05 · **Repo:** frontend · **Backend:** none

## Why

Since SPEC-312/318, signing in stored the organization's slug in a year-long `fte_org` cookie,
and every later visit to the bare `/login` drew that organization's login screen ("Welcome to
<store>.", its logo, colour, picture). The owner saw another organization's name on the
platform's own login page and asked whether that is good.

It is not, for a multi-tenant product:

- On a shared or agency computer the next person, who may belong to another organization, is
  greeted with the previous one's name. That leaks which companies use the product, on a page
  anyone can open.
- The platform's own login looks like one store's product.
- Products with per-workspace branding (Slack, Notion, Linear) brand the login only when the
  address names the workspace. They don't remember it on a shared page.

## Decision

- **Bare `/login` (and every auth screen) is always the platform's own:** ftes for Commerce.
- **The team's login link still works:** `/login?org=<slug>`, the link Settings → Organization →
  Branding hands out, draws that organization's screen *for that visit only*. The name is in the
  address, so the visitor chose it.
- Nothing is remembered. The old `fte_org` cookie is expired on the next visit, so browsers that
  carry one stop showing the brand at once.

## What changes

1. `proxy.ts`: on an auth route, a valid `?org=` is forwarded to the render as the request header
   `x-fte-login-org` (any client-sent copy of that header is dropped first). The response no
   longer sets `fte_org`, and expires one that is still there.
2. `lib/public-branding.ts`: `linkedLoginMedia()` reads that header instead of the cookie.
3. `app/api/session/route.ts`: sign-in no longer looks up the slug (one `/auth/me` round trip
   fewer on every sign-in) and no longer sets the cookie.
4. `lib/auth-flows.ts`: `ORG_COOKIE` stays only so the proxy can expire it; `LOGIN_ORG_HEADER`
   is added.
5. Naming follow-up to SPEC-337 on the screens this touches, all from `PRODUCT`: the auth
   layout's line under the phone logo and its footer, the brand panel's eyebrow, the pricing
   page's eyebrow and footer, the signup subtitle, the share-card descriptions in
   `app/layout.tsx`, and the docs overview's opening sentence. Glisp's own role line ("Glisp · AI
   Business Analyst") is unchanged: it describes the analyst, not the product.

## Acceptance criteria

1. `/login` with an old `fte_org` cookie shows the platform's screen and expires the cookie.
2. `/login?org=<slug>` shows that organization's screen; `/login` afterwards does not.
3. Sign-in sets only the session and refresh cookies.
4. No "AI Business Analyst" / "AI business analyst" / "Ecommerce ·" text is left on auth, pricing
   or metadata.
5. tsc, lint, Vitest, build green.

## Manual verification checklist

- Sign out, open `/login`: the red-band showcase with "Your whole store, on one screen."
- Open `/login?org=<your slug>`: your logo and screen. Open `/login` again: the platform's.

## Verification (2026-10-05)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Old cookie → platform screen, cookie expired | done | served build, `Cookie: fte_org=fame-on-central` → no "Welcome to"; "Your whole store, on one screen."; `set-cookie: fte_org=; Max-Age=0` |
| 2 | `?org=` shows that org for the visit only | partial | `?org=` no longer sets `fte_org` (checked); the branded render needs the backend's public branding read, which was not answering locally |
| 3 | Sign-in sets only session + refresh | done | `organizationSlug` and its `/auth/me` hop removed from `app/api/session/route.ts` |
| 4 | Old wording gone from auth, pricing, metadata | done | grep: only Glisp's own role lines remain, deliberately |
| 5 | tsc / lint / tests / build | done | tsc clean; ESLint 0 errors; **2,300 passed**; build 74 pages |
