# SPEC-149 — Silent session refresh (stop early auto-logout)

## Problem

Users are logged out roughly 30 minutes after login — **while actively working**, not
just when idle. The session has a hard 30-minute ceiling with no renewal:

- Login (`app/api/session/route.ts`) sets two httpOnly cookies: `aias_session` (access
  token, `maxAge = 30 min`, mirrors the backend 30-min access-token TTL) and
  `aias_refresh` (refresh token, `maxAge = 7 days`).
- The middleware gate `proxy.ts` only checks `request.cookies.has(SESSION_COOKIE)`. When
  the 30-minute access cookie expires the browser drops it, so the next navigation is
  redirected to `/login`.
- **The 7-day `aias_refresh` cookie is never used anywhere.** Nothing ever calls the
  backend refresh endpoint, so the access token is never renewed.

Net effect: a fixed 30-minute session that active work does not extend.

The backend already exposes the fix: `POST /api/v1/auth/refresh` with body
`{ refresh_token }` returns `{ user, access_token, refresh_token }` and rotates both
tokens (`app/services/auth/service.py::refresh` → `issue_tokens`). This is a
**frontend-only** change to actually use it.

## Goal

The session stays alive as long as the 7-day refresh token is valid. The access token is
silently re-minted from the refresh token when it expires, transparently to the user. A
user is only sent to `/login` when the refresh token itself is missing/expired/rejected.

## Scope

Frontend repo only. Backend refresh endpoint is unchanged (already exists and rotates
tokens). No change to token TTLs (access 30 min, refresh 7 days).

### Files

- **`lib/refresh.ts`** (new) — server-side helper `refreshTokens(refreshToken)`:
  `POST {API_URL}/api/v1/auth/refresh`, returns `{ accessToken, refreshToken }` on
  success or `null` on any failure (non-2xx, malformed body, network error). No
  `next/headers` usage so it is safe to call from both middleware (Edge) and route
  handlers, and unit-testable in the Vitest node env.
- **`lib/session.ts`** — export a shared `cookieBase` (httpOnly, `sameSite: "lax"`,
  `secure` in production, `path: "/"`) so middleware and both routes set cookies
  identically. `ACCESS_MAX_AGE_SECONDS` / `REFRESH_MAX_AGE_SECONDS` unchanged.
- **`proxy.ts`** (middleware) — becomes `async`. When `aias_session` is absent but
  `aias_refresh` is present, call `refreshTokens`. On success: set the new access token
  on the incoming request cookies (so this request's Server Components see it via
  `cookies()`), continue via `NextResponse.next({ request: { headers } })`, and set both
  refreshed cookies on the response for the browser. On failure: redirect to `/login`
  and clear the stale `aias_refresh` cookie (prevents a redirect loop).
- **`app/api/proxy/[...path]/route.ts`** — when an upstream call returns `401` and an
  `aias_refresh` cookie is present, call `refreshTokens`, retry the original request once
  with the new access token, and set both refreshed cookies on the response. The request
  body is buffered once (`arrayBuffer`) so the retry can replay it; response bodies still
  stream through untouched (chat SSE unaffected). This covers long-lived single-page
  sessions (e.g. chat polling) that cross the 30-min boundary without a navigation.
- **`app/api/session/route.ts`** — reuse the shared `cookieBase` from `lib/session.ts`
  (no behavioural change; single source of truth).

`lib/api.ts::serverApi` needs no change: middleware refreshes the request cookie before
Server Components render, so `serverApi` reads the fresh token.

## Non-goals

- No change to token lifetimes or to the backend.
- No refresh-token reuse detection / server-side revocation list (backend concern, out of
  scope; refresh already rotates the token pair).

## Acceptance criteria

1. With a valid `aias_refresh` cookie and an expired/absent `aias_session`, navigating to
   a gated route does **not** redirect to `/login`; the page renders and the browser
   receives fresh `aias_session` + `aias_refresh` cookies.
2. A client-side `/api/proxy/*` call that gets a `401` with a valid refresh cookie is
   transparently retried with a new access token and succeeds; the response carries
   refreshed cookies.
3. When the refresh token is missing, expired, or rejected by the backend, the user is
   redirected to `/login` and the stale `aias_refresh` cookie is cleared (no redirect
   loop).
4. Refreshed access + refresh cookies use the same attributes as login
   (`httpOnly`, `sameSite=lax`, `secure` in prod, `path=/`) and the standard max-ages.
5. Response streaming (chat SSE) is unaffected by request-body buffering in the proxy.
6. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Tests (`tests/refresh.test.ts`, Vitest node env)

- `refreshTokens` returns `{ accessToken, refreshToken }` on a 200 with both tokens.
- returns `null` on a non-2xx response.
- returns `null` when the body is missing `access_token`/`refresh_token`.
- returns `null` when `fetch` throws (network error).
- posts to `…/api/v1/auth/refresh` with a JSON `{ refresh_token }` body.

## Manual verification checklist (no jsdom/next runner for middleware/routes)

- [ ] Log in; in DevTools → Application → Cookies confirm `aias_session` (~30 min) and
      `aias_refresh` (~7 days).
- [ ] Delete only `aias_session` (simulates access-token expiry), reload a gated page →
      page renders, a fresh `aias_session` is set, no `/login` redirect.
- [ ] Delete both cookies, reload → redirected to `/login`.
- [ ] Sit on the chat page past the access-token TTL, send a message → it succeeds
      (proxy 401 → refresh → retry) and cookies are refreshed.

## Patches

_None yet._
