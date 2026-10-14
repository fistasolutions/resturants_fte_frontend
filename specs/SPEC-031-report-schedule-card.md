# SPEC-031 — Daily Report Schedule Card (Settings)

**Status:** Implemented
**Date:** 2026-07-17
**Backend counterpart:** backend `SPEC-022-report-schedule-setting.md` (the contract)
**Touches:** `types/store.ts`, `services/store.ts`, `services/report-schedule.ts` (new),
`utils/format.ts`, `features/settings/report-schedule-card.tsx` (new),
`app/(app)/settings/page.tsx`, `tests/report-schedule.test.ts` (new)

## Problem

The daily executive report time (06:00 UTC, hardcoded server-side until backend
SPEC-022) is invisible and unchangeable in the UI. The user wants to set it from
the Settings page.

## API contract (backend SPEC-022)

- `GET /settings/status` now includes:
  `report_schedule: { time: "HH:MM", timezone: string, source: "default"|"custom", next_run_at: ISO }`
- `PUT /settings/report-schedule` body `{ "time": "HH:MM" }` → `200 { report_schedule: {...} }`
  (422 malformed, 401 unauthenticated, 409 no store).

## Design

### Types (`types/store.ts`)

`ReportSchedule { time: string; timezone: string; source: "default" | "custom"; nextRunAt: string }`.

### Services

- `services/store.ts` (server): `getSettingsOverview()` — **one** `/settings/status`
  call returning `{ connection, system, reportSchedule }`. The Settings page
  previously hit the endpoint twice (`getStoreConnection` + `getSystemStatus`);
  it now makes a single status call (root Rule 5). The two existing functions
  stay untouched for the dashboard and integrations pages.
- `services/report-schedule.ts` (client, new): `updateReportSchedule(time)` —
  `PUT` through the proxy (`NEXT_PUBLIC_API_URL ?? "/api/proxy"`, same pattern as
  `services/profile.ts`), throws the API error message on failure. Exports pure
  `adaptReportSchedule(api)` (snake→camel) for unit tests.

### Utils (`utils/format.ts`)

`formatNextRun(iso, timezone)` → `"Jul 18, 9:30 AM (America/New_York)"` —
rendered **in the store's zone** via `Intl` `timeZone`, not the viewer's. Falls
back to UTC rendering if the zone name is invalid. Pure, unit-tested.

### Component — `features/settings/report-schedule-card.tsx` (client, new)

shadcn Card, one responsibility, mirroring `profile-form.tsx` exactly:

- Title "Daily Report", description "When your executive report is generated
  each day."
- `<Input type="time">` (semantic token styling only) initialised from
  `schedule.time`, with a Label; timezone shown as muted helper text —
  store zone for a custom schedule, UTC for the default.
- "Next report: {formatNextRun(...)}" line, updated from the PUT response after
  a save (no refetch — root Rule 5).
- Save button: `idle/saving/saved/error` states (spinner, Check + "Saved",
  `role="alert"` destructive error line). Save disabled while saving or when
  the field is empty; editing resets state, native validation via the time
  input. No entrance animation (Rule 9).

### Page (`app/(app)/settings/page.tsx`)

`Promise.all([getCurrentUser(), getSettingsOverview()])` (2 parallel calls,
previously 3), card rendered between ConnectionCard and the status grid.

## Round trips

Settings page load: 3 → 2 API calls. Save: exactly 1 PUT; UI updates from its
response.

## Acceptance Criteria

1. Settings shows the Daily Report card with the current schedule: fresh
   store → `06:00`, "UTC"; after saving → the chosen time and store timezone.
2. Picking a time and saving persists it (survives reload) and the "Next
   report" line updates from the PUT response, formatted in the store's zone.
3. Failure paths: backend down / 4xx → destructive error line, form stays
   editable; saving state disables the button.
4. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green.
5. Unit tests cover `adaptReportSchedule` and `formatNextRun` (incl. invalid
   zone fallback).

## Manual verification checklist (no jsdom runner)

- [ ] Card renders in light **and** dark themes with tokens only.
- [ ] Time picker keyboard-accessible; labels/aria wired; no entrance animation.
- [ ] Save happy path against live backend: button spinner → "Saved", next-run
      updates; backend logs `daily report rescheduled`.
- [ ] Reload → saved time still shown; System Status card unaffected.
- [ ] With backend stopped: saving shows the error line, no crash.
- [ ] Mobile width: card lays out cleanly.
