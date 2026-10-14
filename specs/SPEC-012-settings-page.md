# SPEC-012 — Settings Page

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (PRD §3 Settings: profile, Shopify connection,
sync status, API status, logout; Design.md §21 Settings layout)

## Goal

`/settings`: account + system configuration — profile form, Shopify connection card,
system status, and logout.

## Scope

- **Service additions** `services/store.ts`: `updateProfile({ name })` (mock resolve;
  Phase 8 → PATCH /me) and `getSystemStatus()` → `{ apiStatus: "operational",
  lastSyncAt, syncSchedule: "Every 15 minutes" }` from `lib/mock/store.ts`
  (`types/store.ts` gains `SystemStatus`).
- **Components** (`features/settings/`):
  - `profile-form.tsx` (client) — name (editable, validated via `validateName`),
    email (read-only, "from your account"), Save with loading/success/error states
    per Design.md §12 (success = inline "Saved" confirmation).
  - `connection-card.tsx` — store domain, Active/Disconnected badge, last sync time,
    sync schedule; "Sync now" + "Reconnect" as ComingSoonButtons (backend Phase 5).
  - `status-card.tsx` — API status (Operational, success dot), scheduled sync,
    app version label ("Phase 1 preview").
  - `logout-card.tsx` (client) — explains session, Logout button (destructive
    variant) → `endPreviewSession()` + redirect `/login` (same flow as sidebar).
- Page: `app/(app)/settings/page.tsx` — h1 + stacked sections, `Promise.all` fetches.
- Nav `Settings` enabled.

## Acceptance Criteria

1. Profile: invalid name blocked inline; valid save shows loading → "Saved".
2. Connection card shows examplestore.com, Active, last-sync date; disabled actions
   tooltip "Coming soon".
3. Logout works from the page (cookie cleared, gate re-locks `/`).
4. Lint, tsc, tests, build green.

## Patches

- **2026-07-15 (quick fix, owner request).** The settings card column was capped
  at `max-w-4xl`, leaving dead space on wide screens. The cap is removed — cards
  now span the full content width like the other pages. Inputs inside the
  profile form keep their own `max-w-md` for readability.
