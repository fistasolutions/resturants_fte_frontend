# SPEC-385 — The restaurant digital workforce on screen (W0–W2) and the Ops Coach page

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-401 (master plan), SPEC-402
(Ops Coach) · **Builds on:** SPEC-290 (the employees hub), SPEC-291 (characters), SPEC-229 (docs)

## What changes

- **Every employee visible to a restaurant brand** — the backend now starts a restaurant brand's
  employees switched on and shows Search Visibility (SPEC-401 W0). The screens read the workspace as
  before; nothing on the frontend hid them, so no screen change was needed for W0.
- **The analyst answers from the restaurant engine** (SPEC-401 W1) — Ask Glisp and Report Builder
  get the restaurant tools from the backend; Report Builder's catalogue shows the new Restaurant
  network group from the API.
- **Ops Coach** — a new employee in the Digital Employees hub (restaurant brands only; the backend's
  roster and navigation leave it out for anyone else):
  - `/ops-coach`: business-day picker; **Run the first brief / Run again** and **Email the GMs (n)**
    for head office (`network.manage`); the network note; filters by focus with counts (To fix, All,
    each focus); a card per branch — number and name, focus badge, the one thing to fix, its figures
    on one line, wins, and whether it was emailed.
  - Its character: a sweatband and a stopwatch whose hand sweeps while the card is active
    (`lib/employee-character.ts` `stopwatch`, drawn in `employee-character.tsx`, tokens only).
  - Reads `restaurantQueries.coach(date)`; writes `runOpsCoach`, `emailOpsCoach` in
    `services/restaurant-os-actions.ts`, both in `lib/action-permissions.ts` (`network.manage`).
  - Pure helpers in `lib/ops-coach.ts` (focus order and labels, filtering, the facts line, what can
    still be emailed), tested in `tests/ops-coach.test.ts`.
  - Doc: `lib/docs/content/ops-coach.ts`.

## What FOC sees (Rule 12)

Unchanged — the Ops Coach exists for restaurant brands only.

## Acceptance criteria

1. The hub lists the Ops Coach for a restaurant brand; navigation, prefs, docs, role-gate and
   registry tests pass.
2. `npm test`, `npx tsc --noEmit`, `npm run build` pass.
3. Manual: run the brief on a local demo, filter, read a card, email the GMs.
