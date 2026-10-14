# SPEC-020 — Remove Signup UI

- **Status:** Implemented
- **Date:** 2026-07-16
- **Owner decision:** V1 is a single-client tool; accounts are seeded, not
  self-registered. The signup screen is removed from the app entirely. The
  backend endpoint is independently gated off (backend SPEC-011).
- **Supersedes:** the signup portions of SPEC-005 (auth UI) and the
  signup-mode handling of SPEC-017 (live API session route).

## Changes

1. **Delete** `app/(auth)/signup/page.tsx` (route no longer exists → 404 via
   the auth-route redirect rules) and `features/auth/signup-form.tsx`.
2. **Login form** (`features/auth/login-form.tsx`): remove the
   "Don't have an account? Sign up" footer link (and the now-unused `Link`
   import). No other behavior changes.
3. **Route gate** (`proxy.ts`): `AUTH_ROUTES = ["/login"]` — `/signup` is no
   longer treated as an auth route, so unauthenticated visits to `/signup`
   redirect to `/login` like any other unknown protected path.
4. **Session route** (`app/api/session/route.ts`): login-only. The `mode` and
   `name` fields are removed from the accepted body; POST always proxies to
   `/api/v1/auth/login`. DELETE (logout) unchanged.
5. **Auth service** (`services/auth.ts`): remove `SignupInput` and `signup()`;
   `login()` posts `{email, password}` (no `mode` discriminator — the session
   route has a single POST action now).
6. **Tests** (`tests/auth.test.ts`): drop the signup suite; update login
   payload expectations (no `mode` field). Login error-handling and logout
   tests unchanged.

## Out of scope

- Store-switcher changes (separate decision, not requested).
- Backend endpoint gating — backend SPEC-011.

## Acceptance criteria

- [x] No file under `app/`, `components/`, `features/`, `services/`, `types/`,
      `utils/` references signup.
- [x] Login page renders with no signup link; login flow works end to end.
- [x] Visiting `/signup` unauthenticated redirects to `/login`; authenticated
      redirects to `/` (falls out of the standard gate rules).
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green.

## Manual verification checklist (no component test runner yet)

- [ ] `/login` shows email + password only, no "Sign up" text anywhere.
- [ ] Successful login redirects to dashboard; bad password shows the error.
- [ ] `/signup` never renders a page in either auth state.
