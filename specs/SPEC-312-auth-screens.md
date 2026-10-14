# SPEC-312 — Sign in, sign up, verify, reset, invitations: the auth screens

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-28
**Programme:** `SPEC-311-saas-platform-master.md`, slice **F2** (with the part of F1 it needs:
knowing, at sign-in, whether the user has an organization yet)
**Backend contract:** backend SPEC-313 (auth v2), SPEC-318 (public branding), SPEC-317 (`/auth/me`)

## Why

The owner: sign up and sign in with email + password (verified by an emailed code), with
Google, or with Shopify — Google and Shopify prove the address themselves, so no code. Forgot
password by code. "Very seamless, frictionless." Today there is only a password login.

## Screens (all public in `proxy.ts`, all in `app/(auth)/`)

| route | what it does |
| --- | --- |
| `/login` | email + password · **Continue with Google** · **Continue with Shopify** (asks the shop, `name` or `name.myshopify.com`) · links to sign up and forgot password. A right password on an unverified address → straight to `/verify` (the backend has just sent a code). |
| `/signup` | name · email · password (≥ 8) · the same two buttons → `/verify?email=` |
| `/verify?email=` | one 6-digit box (paste, digits only, submits itself at 6), **Resend code** with a 60 s cooldown (the backend's) → signed in |
| `/forgot` | email → `/reset?email=` (the same message whether or not the address has an account) |
| `/reset?email=` | code + new password → signed in (every other device is signed out by the backend) |
| `/auth/google/callback`, `/auth/shopify/callback` | finish the provider round trip, then go where the user was going |
| `/invite/[token]` | the organization, the role and the address; **no account** → name + password (the link proves the address — no code); **an account** → sign in, then accept; **signed in** as that address → **Accept** |

After any sign-in the browser goes to the page it came for, else `/`; a user who belongs to **no
organization yet** goes to `/onboarding` (slice F3 builds it).

## How

- **`app/api/session/route.ts` stays the only place tokens are handled.** `POST` takes a `kind`
  — `password` (the default, so today's login keeps working), `verify`, `reset`, `register`,
  `google`, `shopify`, `invite` — maps it to the backend endpoint (`lib/auth-flows.ts`
  `sessionRequest`, pure), sets the two httpOnly cookies when tokens come back, and answers
  `{user, hasOrganization, redirect}` (never a token). `hasOrganization` is read from the new
  access token's `org` claim (decoded, not verified — the backend verifies it on every call).
  A `register` without an invitation answers `{status: "code_sent"}`.
- Calls that mint nothing (resend a code, forgot, the provider start URLs, the invitation
  preview) go through `/api/proxy` like every other browser call.
- **The organization's login screen (backend SPEC-318):** the auth layout reads the `fte_org`
  cookie (set at sign-in, and by `/login?org=<slug>` or an invitation) and fetches
  `/branding/{slug}` on the server; the brand panel shows the organization's logo and its image,
  video (muted, looping, poster) or carousel (switches every 6 s, no animation — Rule 9 — with
  dots to choose). No slug or no media → the platform's panel, as today. Asset URLs are served
  through `/api/proxy`.
- Error wording is the backend's; the one addition is routing: `email_not_verified` → `/verify`,
  `password_not_set` → the Google/Shopify buttons and the reset link are pointed out.
- Pure logic in `lib/auth-flows.ts` and `lib/login-media.ts` (Vitest); screens in
  `features/auth/`.

## Tests

Vitest: the session request for every kind (path, body, bearer for `invite`, legacy body =
password); the organization claim read from a token (present, absent, malformed); the
destination after sign-in (safe `next` only, no org → `/onboarding`); the next step for each
backend error code; the code box's digit filtering; the Shopify shop normaliser; the resend
cooldown; the branding view model (asset URL through the proxy, kinds, empty) and the carousel
index. `npm test`, `npx tsc --noEmit`, `npm run build` green.

Manual checklist (no component runner — root Rule 4): each screen in light and dark, keyboard
only, at phone width; a wrong code, an expired code, resend cooldown, an invitation for another
address, a Google and a Shopify round trip.

## Acceptance criteria

- [x] **done** — Email + password sign-up with an emailed code; Google and Shopify with no code.
- [x] **done** — Forgot password by code; sign-in afterwards is automatic.
- [x] **done** — Invitations open, register or accept, and land in the organization.
- [x] **done** — The login screen shows the organization's logo and media when it is known (`fte_org`, `/login?org=`).
- [x] **done** — Tokens never reach client JavaScript. `npm test` 2,048 passed · `tsc` clean · eslint clean · `npm run build` green. A user with no organization is sent to `/onboarding`, which slice F3 builds next.


## Patches

### 2026-09-28 — the marketing site's logo, and a login panel worth landing on (owner request)

- **One logo everywhere:** `components/shared/brand-logo.tsx` (`BrandLogo`, `BrandMark`) redraws the
  marketing site's mark (`ecommerce-fte/components/ui.tsx` — the E tile followed by "commerce") as
  token-driven SVG: the tile takes the text colour, the E is cut out in the surface colour (`paper`),
  the underline is `--brand`. It replaces the `/brand/logo-{black,white}.png` wordmark in the sidebar
  (and the E mark on the collapsed rail), the auth layout, the brand panel, the onboarding header and
  the Branding tab's "using the platform logo" preview.
- **The login panel with no organization picture** is no longer an empty black half: the marketing
  site's headline ("Your store runs on a dozen apps. See them all in one place."), the one-line
  summary, and four highlights (Ask Glisp · one dashboard refreshed every 15 minutes · AI employees ·
  connect once) — each sentence true of the product today. With an organization's picture, video or
  carousel the highlights stay out of the way; a known organization still gets "Welcome to <name>."
  The panel scopes the dark palette (`dark` class) so token-drawn marks read on the black scrim.
- The form side drops its duplicate "AI Business Analyst" eyebrow (the panel carries it) and its
  footer names the product.

### 2026-09-28 — the showcase panel: the owner's pick of eight mockups ("03 · Product Peek")

- The black panel with highlights is replaced, when no organization picture is set, by `Showcase`
  in `features/auth/brand-panel.tsx`: a deep slate panel (new theme-invariant tokens `--showcase`,
  `--showcase-foreground`, `--showcase-muted`, `--showcase-border` in `globals.css`), the logo, a
  drawing of the app bleeding off its edge (`features/auth/product-preview.tsx` — sidebar, four KPI
  tiles, a revenue chart; bars, never numbers; `aria-hidden`; drawn in the app's own tokens so it
  follows the theme) and "Your whole store on one screen." (or "Welcome to <name>." for a known
  organization). An organization's picture, video or carousel still takes the whole panel.
- The form side is `bg-card` (white in light theme), as in the mockup.
- Verified by screenshot at 1440×900 and 1366×768.

### 2026-09-28 — the showcase in the marketing identity: the owner's pick "R5 · Red Band"

- Supersedes the slate "Product Peek" panel above. `Showcase` is now the marketing site's paper
  (`--showcase`, honeycomb pattern drawn as an inline SVG pattern in `currentColor`) above a
  **brand-red band** filling the lower half (`--showcase-band`), with the drawing of the app across
  the two and, on the red, "[ AI Business Analyst ]" (mono), "Your whole store, on one screen." in
  the marketing display serif (Instrument Serif, loaded by `app/(auth)/layout.tsx` only, exposed as
  `font-display`) and the one-line summary.
- `features/auth/product-preview.tsx` is the marketing "window": three dots, "Good morning",
  "Updated every 15 min" in mono, four KPI tiles with mono labels and bars (never numbers), and a
  net-sales chart — the brand-red line against last period's dashed one.
- Tokens `--showcase`, `-foreground`, `-muted`, `-border`, `-card`, `-tile`, `-band`,
  `-band-foreground`, `-band-muted` (light: paper and ink; dark: the marketing site's dark paper;
  the band is brand red in both). The red band is the one place brand red fills an area: it is the
  identity panel of the sign-in page, chosen by the owner, never status or a control (Rule 9).
- Verified by screenshot at 1440×900 and 1366×768.

### 2026-09-28 — real provider marks on Continue with Google / Shopify (owner request)

`components/shared/provider-marks.tsx`: Google's four-colour G and Shopify's bag (the Simple Icons
glyph, CC0) in Shopify's two greens — the one sanctioned exception to "tokens only", because a
third-party brand mark keeps its owner's colours. The buttons are 44 px, white card, soft border and
shadow, hover tint; the shop field that opens after "Continue with Shopify" matches them.
