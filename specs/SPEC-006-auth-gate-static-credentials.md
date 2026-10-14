# SPEC-006 — Auth Gate & Static Demo Credentials

**Status:** Implemented
**Phase:** 1 — Frontend Foundation
**Governing docs:** ../docs/prd.md §3 (Authentication incl. Logout), root CLAUDE.md
Rules 6/9; supersedes SPEC-005's "any valid credentials work" behavior.

## Goal

The app starts at Login: every app route is gated until a session exists, and Phase 1
sign-in only succeeds with the owner-provided static demo credential. Wrong credentials
fail with a clear inline error. Logout ends the session.

## Behavior

1. **Gate (server-side, `proxy.ts`)** — Next 16 Proxy (renamed Middleware):
   - No session cookie + any app route → redirect `/login`.
   - Active session + `/login` or `/signup` → redirect `/`.
   - Static assets and Next internals excluded via matcher.
2. **Static credential** — defined once in `lib/mock/credentials.ts`
   (email + password provided by the owner, 2026-07-15). `services/auth.login`
   validates: email match is case-insensitive/trimmed, password exact. Mismatch →
   rejects with "Invalid email or password." shown in the form's alert region;
   no navigation, no session.
3. **Session (Phase 1 preview)** — client-set cookie `aias_preview_session=1`
   (path=/, max-age 7 days, SameSite=Lax) via `lib/session.ts`
   (`startPreviewSession`/`endPreviewSession`). Phase 8 replaces this with the real
   JWT + httpOnly refresh cookie from the backend — the gate stays, the cookie source
   changes.
4. **Signup** — creates a preview session directly (normal signup-then-signed-in
   behavior); documented as preview until the real API.
5. **Logout (PRD V1 auth feature)** — icon button in the sidebar user row: ends the
   session, redirects to `/login`.
6. **Login page hint** — SPEC-005's "any valid credentials work" note is replaced by a
   "Demo access" block showing the demo email/password (discoverable preview access —
   standard demo HCI). Removed by the Phase 8 spec.
7. **Consistent identity** — `lib/mock/store.ts` user email = the demo email, so the
   sidebar identity matches who logged in.

## Tests (Rule 4)

`tests/auth.test.ts`: login resolves for the demo credential (exact, case-insensitive
email, trimmed email); rejects wrong password, wrong email, empty input; signup
resolves with trimmed profile.

## Acceptance Criteria

1. Fresh visit to `/` (no cookie) lands on `/login` (server redirect, no flash).
2. Wrong credentials → inline alert error, stays on `/login`.
3. Demo credential → session cookie set → dashboard; revisiting `/login` while
   signed in bounces to `/`.
4. Logout from the sidebar returns to `/login`; `/` is gated again.
5. All auth service paths unit-tested; `npm test` green.
6. `npm run lint`, `npx tsc --noEmit`, `npm run build` green.

## Manual verification checklist

- [ ] Incognito → `/` → redirected to `/login`.
- [ ] Bad password → error announced, focus preserved.
- [ ] Demo credential → dashboard; back-button to `/login` bounces home.
- [ ] Logout → `/login`; deep link `/` redirects again.

## Patches

- 2026-07-15 — **Logout confirmation (owner request).** Both logout triggers (sidebar footer icon, Settings session card) now open a confirmation AlertDialog ("Log out?") before ending the session — shared `features/auth/logout-dialog.tsx`; keyboard/Escape dismissible, destructive confirm action.
- 2026-07-15 — **Crawler opt-out (owner asked about SEO/AEO/GEO).** Internal tool = deliberately unindexable: `app/robots.ts` (deny-all robots.txt) + root-metadata `robots: noindex, nofollow, nocache`. Prevents the public login page (incl. its demo-credentials hint) from ever indexing.
