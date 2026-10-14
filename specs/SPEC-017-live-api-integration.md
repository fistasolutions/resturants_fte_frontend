# SPEC-017 — Live API Integration (Phase 8 frontend swap)

**Status:** Implemented
**Phase:** 8 — Dashboard Integration
**Governing docs:** ../docs/Architecture.md (browser → Next proxy → FastAPI; JWT +
httpOnly cookie), root CLAUDE.md Rules 5/6/8; backend contract = backend
SPEC-007/008/009 endpoints.

## Goal

Swap the service layer from mock fixtures to the live backend with the SAME service
signatures (the Phase 1 promise): components don't change; only `services/` and the
auth/session plumbing do.

## Design

- **Env:** `.env.local` — `API_URL` (server-only backend origin) and
  `NEXT_PUBLIC_API_URL=/api/proxy` (browser base). `.env.example` committed.
- **Session:** `POST /api/session` (login|signup) calls the backend auth endpoints
  server-side and sets `aias_session` (access JWT) + `aias_refresh` **httpOnly**
  cookies; `DELETE /api/session` clears them. `proxy.ts` gate now checks
  `aias_session`. Tokens never touch client JS (Rule 6).
- **Proxy:** `app/api/proxy/[...path]/route.ts` forwards GET/POST/PUT/PATCH/DELETE
  (one shared `forward` handler exported per method — Next only accepts exported
  verbs, anything else 405s at the proxy) to `${API_URL}/api/v1/*`, injecting
  `Authorization: Bearer <cookie>`; responses stream through untouched (required
  for chat SSE). 401 upstream → clears cookies.
- **Server-side data:** RSC services call the backend directly via `lib/api.ts`
  (`serverApi`) with the cookie token — no proxy hop for server renders (Rule 5).
  Client code (chat, auth forms, profile) uses the proxy.
- **Adapters** (`lib/adapters.ts`): backend snake_case JSON → existing view models.
  Documented mappings where the domains differ:
  - Order.status: `paid→paid`, `refunded|partially_refunded→refunded`, else `pending`.
  - Dashboard period: `compare/date` UI params map to backend `today|7d|30d|90d`
    buckets (previous_day→today, previous_week→7d, previous_month→30d).
  - `RevenuePoint.previous` = 0 (previous-day overlay not yet served — V1 limit).
  - `Kpi` deltas for customer KPIs = 0 until the backend serves customer deltas.
  - `AlertsSummary.highDiscountProducts` = 0 (not tracked in V1).
  - Inventory `location` = "All locations" (aggregate), `incoming` = 0 (untracked).
  - Customer `lastOrderAt` ← profile `created_at` (last-order date not yet served).
  - Returns: `status` is always `refunded` (backend stores completed refunds),
    `reason` ← refund note.
- **Chat:** `getAssistantReply` POSTs `/api/proxy/chat`, reads the SSE stream, and
  resolves the concatenated deltas; `{"error": …}` frames reject.
- **Reports:** list + per-date fetch; `summary` metrics built from the backend's
  `metrics.sales` payload (values preformatted with existing `utils/format`).
- **Mock modules stay** for Vitest fixtures only; no component imports them anymore
  (services are the only seam, as designed).

## Files

`.env.local`, `.env.example`, `lib/api.ts`, `lib/adapters.ts`, `lib/session.ts`,
`app/api/session/route.ts`, `app/api/proxy/[...path]/route.ts`, `proxy.ts`
(cookie name), all `services/*.ts`, `features/auth/{login,signup}-form.tsx`,
`features/auth/logout-dialog.tsx`, `tests/auth.test.ts` (fetch-mocked),
`tests/adapters.test.ts` (new).

## Manual verification checklist (no jsdom runner yet)

1. `uv run uvicorn app.main:app --port 8000` + `npm run dev` → signup at
   `/signup` → lands on dashboard.
2. Dashboard shows live store numbers after a sync; orders/products/customers/
   inventory/discounts/returns pages list live rows; settings shows the real
   domain + last sync.
3. Chat streams a real answer citing tool numbers.
4. Logout returns to `/login`; deep links redirect while logged out.

## Acceptance Criteria

1. No service imports mock data; every page renders from the live API.
2. Tokens only in httpOnly cookies; no secret in client bundles.
3. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Patches

- **2026-07-15 — Top-products images (owner request).** Backend now returns
  `image_url` in the dashboard top-products payload (backend SPEC-008 Patches).
  Frontend: `TopProduct.imageUrl` added (adapter maps `image_url`; mock fixtures
  updated), `next.config.ts` allows `cdn.shopify.com` via
  `images.remotePatterns`, and the dashboard Top Products list renders a 36px
  product thumbnail through `next/image` (cover-fit, rounded) with the
  ShoppingBag tile as the fallback for products without an image.
  *(Recovered 2026-08-27 from `SPEC-015-live-api-integration.md`, a stray
  4-line `## Patches` fragment that collided with the real SPEC-015
  — `SPEC-015-light-theme-default-toggle.md`. This is the Phase 8 spec the
  record belonged to; the stray file has been deleted now that its only
  content lives here.)*

- **2026-07-15 — chart overlay + equal card heights.** The overview chart now
  consumes the backend's always-7-day `revenue_series` with the new
  `revenue_series_previous` overlay (removes the "previous = 0" launch
  limitation); Revenue Overview and Top Products cards get `h-full` so the
  grid row renders both at equal height.

- **2026-07-15 (quick fix, owner report).** The dashboard period Select was
  labeled with the *comparison* windows ("Previous day/week/month"), which read
  as if the user were viewing yesterday's data. It actually selects the viewed
  rolling window (backend `period=today|7d|30d`). Labels now say what is shown —
  **Today / Last 7 days / Last 30 days** — and the Select trigger displays that
  period label instead of the "Compared to <date>" text. KPI delta suffixes
  ("vs yesterday/last week/last month") are unchanged and remain accurate.
  `DashboardData.comparisonLabel` was removed (its only consumer was the
  trigger); URL param values (`?compare=previous_*`) are unchanged for
  back-compat.

- **2026-07-16 — proxy 405 on DELETE (owner report).** Deleting a chat
  conversation failed with 405: the proxy route only exported
  `forward as GET, forward as POST`, so Next.js rejected
  `DELETE /api/proxy/chat/conversations/:id` before it ever reached the backend
  (whose `DELETE /chat/conversations/{id}` endpoint, backend SPEC-010
  chat-persistence, was fine). Fix: export the same `forward` handler for
  `PUT`, `PATCH`, and `DELETE` as well — the handler was already method-generic
  (`method: request.method`, body forwarded for non-GET). New
  `tests/proxy-route.test.ts` asserts all five verbs are exported and that a
  DELETE is forwarded upstream with its method and path intact.

- **2026-07-16 — logout race (owner report: "log out keeps me logged in").**
  `LogoutDialog.handleLogout` fired `void logout()` and called
  `router.push("/login")` while the `DELETE /api/session` cookie-clear was
  still in flight — the proxy gate saw the still-present `aias_session`
  cookie on the /login navigation and bounced the user back to `/`
  (`hasSession && isAuthRoute → redirect("/")`); the cookies then cleared,
  leaving a logged-out user staring at a cached app page. Fix: `await
  logout()` (with a pending state disabling the action button), then a HARD
  navigation `window.location.assign("/login")` — a full page load runs the
  proxy gate with cookies already cleared and drops the client router cache.
  No backend change: logout endpoints were evaluated and rejected — refresh
  JWTs are stateless (nothing stored server-side to revoke); cookie deletion
  at the Next layer IS logout in this design. Manual verification: log in →
  log out → land on /login; back button/deep link to `/` redirects to /login;
  logging in again works.

- 2026-07-20 — **Back button resurrected the login page (owner report).**
  After signing in, `router.push("/")` left `/login` in the browser history;
  Back restored it from the back-forward cache without any server request, so
  the proxy gate never ran. Fix mirrors the logout fix: a hard
  `window.location.replace("/")` after login — the login entry is REPLACED in
  history (Back now leads to whatever preceded it), and any real navigation
  back to /login hits the gate as a full request and bounces to `/`.
