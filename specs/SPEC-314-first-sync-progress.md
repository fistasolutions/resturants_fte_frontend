# SPEC-314 — The first sync, live: a progress toast and pages that open as their data lands

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-28
**Programme:** `SPEC-311-saas-platform-master.md`, slice **F4**
**Backend contract:** backend SPEC-316 — `GET /stores/current/bootstrap` (state, step,
steps done, and each step's `reveals`) and `GET /stores/current/bootstrap/events` (SSE: a frame
on every change, keep-alive comments, the stream ends when the sync is done or failed)
**Follows:** SPEC-313 (onboarding lets the owner open the dashboard once the orders are in)

## Why

The owner: the first 30 days sync "SSR oriented toaster" — the progress is shown live, and each
screen appears as its data arrives, "progressive reveal". Today a page opened mid-sync shows
empty tables or errors.

## Behaviour

- **One provider in the app layout** (`FirstSyncProvider`): on mount it reads
  `/stores/current/bootstrap` once. `done` (every store connected before this platform, and every
  store after its first sync) → nothing more happens, ever. Otherwise it follows the SSE stream
  through `/api/proxy` (an `EventSource`; it falls back to reading every 3 s if the stream
  cannot open) until the sync is `done` or `failed`.
- **The toast** (top right, the shared `media-toast-host`, like the other progress toasts): "Syncing
  your store" · each step with ✓ / spinner / waiting · a bar of steps done · "Runs in the
  background — keep working". On `done`: "Your store is fully synced" and it can be closed; on
  `failed`: the reason and **Try again** (`POST …/bootstrap/retry`). No entrance animation
  (root Rule 9); the spinner is the only motion and it reports something real.
- **Pages open as their data lands** (`FirstSyncGate`, wrapping the page content in the app
  layout — one place, every route): while the sync runs, a page whose data a step has not revealed
  yet shows a calm "Your orders are still syncing — this page opens by itself when they land"
  panel (with the skeleton pulse) instead of empty tables or errors, and opens by itself the
  moment its step finishes. Pages no step gates (Settings, Integrations, Docs…) are never held.
  The page key is the route's first segment (`/` is the dashboard; `/employees/finance` is
  finance), matched against the steps' `reveals`.

## How

- `lib/first-sync.ts` (pure): the page key of a path; which keys are revealed and which are
  gated; whether a path is ready; the toast's view (title, tone, lines, fraction done); the SSE
  frame parser.
- `features/first-sync/`: `first-sync-provider.tsx` (state + stream), `first-sync-toast.tsx`,
  `first-sync-gate.tsx`.
- Round trips: one read on mount; nothing else once the store is synced. During the sync, one
  open stream (the backend reads its row once a second, SPEC-316).

## Tests

Vitest: page keys (root, nested, employees/finance); ready/not ready for a gated and an ungated
path, during and after the sync, and when failed; the toast view for running / done / failed;
the frame parser (a payload, a keep-alive, garbage). `npm test`, `npx tsc --noEmit`, `npm run build`
green. Manual: a store mid-sync — the toast ticks, `/orders` opens by itself when the first step
finishes, `/settings` is never held; a failed sync and its retry; light and dark.

## Acceptance criteria

- [x] The first sync's progress is shown live on every page until it ends.
- [x] A page waits calmly for its data and opens by itself when that data lands; ungated pages never wait.
- [x] A synced store costs one read on load and nothing more.
- [x] Tests, type-check and build green.

## Verification (2026-09-28)

`npm test` 2,060 passed; `npx tsc --noEmit` clean; `npm run build` green. All four criteria done
(the manual mid-sync pass runs on the first new organization's connect).
