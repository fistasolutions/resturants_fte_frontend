# SPEC-313 — Onboarding: organization → plan → connect Shopify → first sync

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-28
**Programme:** `SPEC-311-saas-platform-master.md`, slice **F3**
**Backend contract:** backend SPEC-314 (`GET /onboarding`, `POST /onboarding/organization`,
`GET /plans`, `POST /billing/subscription`), SPEC-315 (connect by link), SPEC-316 (first sync)
**Follows:** SPEC-312 (a signed-in user with no organization is sent to `/onboarding`)

## Why

The owner: sign up → choose the plan by annual revenue (up to $3M $500/mo · $3M–$30M $800/mo ·
$30M+ $1,200/mo, a dummy payment for now) → connect Shopify by link → the first 30 days sync on
their own. One screen per step, one primary action, and a reload resumes where it stopped.

## The wizard (`/onboarding`, its own layout — no sidebar)

The step is **the backend's** (`GET /onboarding`: `organization → plan → connect_store →
syncing → ready`), read by the server page on every render; each action ends in
`router.refresh()`, so the page always shows the step the backend says — never a step the
browser merely remembers.

| step | screen | action |
| --- | --- | --- |
| `organization` | "Name your company" | `POST /api/session` `kind: organization` → the backend creates it with the user as Owner and returns tokens that work in it; the session route swaps the cookies (tokens never reach client JS) |
| `plan` | the three plans from `GET /plans`, each with its band, price and the AI it includes | choose one → a **confirm** panel ("$X / month · no card needed during the preview") → `POST /billing/subscription` |
| `connect_store` | "Connect your Shopify store" — the shop (`name` or `name.myshopify.com`) | `POST /stores/connect/start` → Shopify's own approval screen → back to `/onboarding/shopify/callback` → `POST /stores/connect/callback` → `/onboarding` |
| `syncing` | the first sync's steps (backend SPEC-316 catalogue) — done, running, waiting — read every 2 s from `GET /stores/current/bootstrap` | **Open your dashboard** once the orders step is in; **Try again** (`POST …/bootstrap/retry`) if it failed |
| `ready` | — | the server page redirects to `/` |

A progress rail shows the four steps (organization · plan · store · sync). **Sign out** is always
there.

## The gate (`proxy.ts`)

A signed-in user whose access token carries **no organization** (`org` claim, read — the
backend verifies it) is redirected from any app page to `/onboarding`. `/onboarding` itself
needs a session like any app page.

## How

- `lib/onboarding.ts` (pure): the steps, the rail's state, plan cards (price and AI allowance in
  dollars from cents), the sync step list from the bootstrap payload, when the dashboard may open.
- `services/onboarding.ts`: the reads (server) and writes (client, through `/api/proxy`).
- `features/onboarding/*`: one component per step.

## Tests

Vitest: the rail for every step; plan cards (order, dollars, "most popular" none — no invented
labels); the sync list (done / current / waiting / failed) and when the dashboard opens; the
session request for `organization` (bearer, body); the proxy's no-organization decision.
`npm test`, `npx tsc --noEmit`, `npm run build` green.

Manual checklist: each step in light and dark, keyboard only, phone width; a reload on every
step; a Shopify round trip; a failed first sync and its retry.

## Acceptance criteria

- [x] **done** — A new account creates its organization, chooses a plan, connects Shopify and watches the first sync, one step per screen.
- [x] **done** — A reload always resumes on the backend's step (the server page reads `GET /onboarding` on every render; each action ends in `router.refresh()`).
- [x] **done** — A signed-in user without an organization cannot reach the app — `proxy.ts` sends every page to `/onboarding` (refreshed cookies carried on that redirect).
- [x] **done** — `npm test` 2,054 passed · `tsc` clean · eslint clean · `npm run build` green. Round trips: the page is one backend read, plus one in parallel on the plan (`/plans`) and sync (`/stores/current/bootstrap`) steps; the sync list polls every 2 s only until it finishes.

## Added during implementation

- The connect screen does not promise "read-only": the connect link also asks for `write_content`
  (Spotlight publishing, backend SPEC-315), so it says Shopify shows exactly what access is asked for.
- The plan cards carry no invented "most popular" label — only the backend's bands, prices and AI allowance.
