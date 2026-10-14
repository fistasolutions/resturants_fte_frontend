# SPEC-363 — View as company: entering a support session, the banner, the warning

**Status:** Implemented
**Date:** 2026-10-09
**Repo:** ecommerce-fte-frontend
**Contract:** backend `SPEC-371-view-as-company-support-sessions.md`
**Other slices:** admin backend SPEC-007, admin frontend SPEC-005

## What changes

An operator clicks **View as company** in the admin console. A new tab opens
`{FRONTEND_URL}/api/support-session?code=…`, and they are inside that company's app as its owner,
with full access, until the session ends. This repo provides the entry, the banner, the exit and
the warning.

1. **The entry, a route handler** (`app/api/support-session/route.ts`, `GET ?code=`).
   - It exchanges the code server-side (`POST /auth/support-session`, forwarding the browser's
     user agent and IP), so the code never touches client JavaScript.
   - It sets the httpOnly session cookie for exactly the session's remaining time and **clears the
     refresh cookie**: a support session never refreshes.
   - It also sets a marker cookie, `aias_support` (not httpOnly, no secret in it: the end time
     only), so the banner knows to draw without a request for everyone else.
   - It then redirects to `/`. A refused code redirects to `/support-session/ended?reason=link`.
   - `DELETE` (the banner's Exit) ends the session on the backend
     (`DELETE /auth/support-session`), clears all three cookies, and answers `{ok}`.
2. **The banner** (`features/support-session/support-banner.tsx`, mounted once in
   `app/(app)/layout.tsx` above everything). It draws only when the marker cookie is present
   (`useSyncExternalStore`, server snapshot "absent", so there's no hydration mismatch). It reads
   `/auth/me` `support_session` once and shows:
   - "Support session · {company} · as the owner · {operator}"
   - a live countdown ("27 min left", re-drawn every 15 seconds)
   - **Exit**, which goes to `/support-session/ended`
   - the line "Nothing you do here sends to real people."

   It uses a token-only warning tone and stays fixed at the top. No entrance animation.
3. **The warning.** `apiErrorFromResponse` (the one place every transport turns a failure into
   an `ApiError`) announces a 423 `support_session_blocked` with a `support-session-blocked`
   window event. The banner shows its message for 8 seconds: "Nothing was sent: support sessions
   can't send to real people." The screen's own error handling still shows its usual message.
4. **The end.** `/support-session/ended` is a plain page ("This support session has ended. You
   can close this tab.") that clears the marker. The route gate sends a support tab whose
   session cookie has run out (marker present, session absent) there instead of to the login
   screen. `/support-session` is an open route.

All logic is in `lib/support-session.ts` (pure, Vitest): the cookie names and value, the
time-left label, the remaining seconds, recognising the blocked error, and adapting
`support_session`.

## FOC after this change

**Unchanged.** Nothing draws, and no request is added, without the marker cookie. FOC's owner
sees the app exactly as before.

## Acceptance criteria

1. A valid code lands on `/` signed in, with no refresh cookie and a session cookie that lives
   exactly the session's remaining time. A bad code lands on the ended page.
2. Without the marker the banner renders nothing and makes no request.
3. With it, the banner shows the company, the operator and a countdown, and Exit ends the
   session and lands on the ended page.
4. A 423 `support_session_blocked` from any client write fires the event, and the banner shows
   the warning.
5. A support tab whose cookie expired goes to the ended page, not the login screen.
6. `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` are green.

## Manual verification

1. From the console, View as company → the new tab opens on the app with the banner.
2. Brief → send overdue lists → the warning shows; nothing is sent.
3. Exit → the ended page; reloading `/` asks for sign-in.
4. Start a 15-minute session and wait: the tab lands on the ended page.

## Verification (2026-10-09)

| # | Criterion | Status |
|---|---|---|
| 1 | Valid code → `/` with no refresh cookie and a session cookie for exactly the remaining time; a bad code → the ended page | done in `app/api/support-session/route.ts`; checked by reading the code, no browser |
| 2 | No marker, no banner and no request | done (`useSyncExternalStore`, server snapshot false) |
| 3 | Banner shows the company, operator and countdown; Exit ends the session | done |
| 4 | A 423 `support_session_blocked` fires the event; the banner warns | done in `lib/api-error.ts`; tested in `tests/support-session.test.ts` |
| 5 | An expired support tab goes to the ended page | done in `proxy.ts` |
| 6 | Lint, types, tests, build | done: lint 0 errors (3 old warnings), `tsc` clean, `npm test` 230 files / 2562 tests passed, build 82/82 pages with `/api/support-session` and `/support-session/ended` |

The Exit is registered in `lib/action-permissions.ts` `SCREEN_WRITES` as `member` (Rule 13).
**In-app docs are deliberately not changed:** they are the customer's, and the owner decided the
customer is never told about support sessions. The manual checklist has not been run in a
browser.
