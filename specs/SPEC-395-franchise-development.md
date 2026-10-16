# SPEC-395 — Franchise Development page

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-416 · **Plan:** backend SPEC-386 (R13)

## What

A restaurant brand's head office follows its growth on `/development` ("Franchise Development" in the
sidebar, restaurant brands only — the backend's navigation `development` destination, `network.manage`).

- `app/(app)/development/` — layout (`RestaurantShell`, no tabs, no period) · page (prefetches
  `restaurantQueries.development()` and `franchisees()`) · content-only loading.
- `features/restaurant-os/development-view.tsx` — three tiles (open prospects, opening in 90 days,
  openings at risk), the due next steps, the prospects (add · move to a stage · **Sign** with the royalty
  and ad fund rates) and the openings (add for a franchisee · move · **Open** with the store number;
  at-risk badge).
- `lib/development.ts` — stage labels and `movableProspectStages` / `movableOpeningStages` (never
  `signed` / `open`, which have their own buttons; nothing once final).
- Data: `restaurantQueries.development` → `GET /restaurant/development`; writes in
  `services/restaurant-os-actions.ts`, each `network.manage` in `lib/action-permissions.ts`; every
  button is a `RoleButton`.
- Doc `lib/docs/content/development.ts` (Rule 11); nav-tab registry `"/development": []`.

## What FOC sees (Rule 12)

Nothing — the page and its nav item exist only for an organization with the `restaurant` feature.

## Acceptance criteria

1. The page renders the backend's summary, prospects and openings with loading, empty and error states.
2. Signing and opening go only through their own buttons; final rows offer no moves.
3. Every write is role-gated; the doc and nav coverage tests pass.

## Manual verification checklist

- As head office: add a prospect, move it, sign it — the franchisee appears in Network.
- Add an opening 20 days out — it shows At risk; Open with a free store number — the branch appears.
- As a franchise-scoped member: the page is not in the sidebar.
