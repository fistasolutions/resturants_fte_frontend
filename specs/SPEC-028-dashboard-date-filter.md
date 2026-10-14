# SPEC-028 — Dashboard Date Filter (calendar actually filters)

- **Status:** Implemented
- **Date:** 2026-07-17
- **Backend:** SPEC-019 (`GET /dashboard` gains optional `date`).
- **Bug being fixed:** the calendar updated the URL and the label but the
  date never reached the API — the dashboard always showed now-anchored
  windows regardless of the selected day.

## Changes

1. `services/dashboard.ts` — the validated/clamped `date` is now passed to
   the API (`/dashboard?period=…&date=…`). No shape changes; adapters
   untouched.
2. Comparison label honesty: "(same time)" only applies when viewing today
   (partial day vs partial day). For a historical date the label drops the
   suffix — a full day is compared to the prior full day.

## Acceptance criteria

- [x] Picking a calendar date changes every dashboard number to that day.
- [x] Today (default) behavior and label unchanged.
- [x] All four frontend gates green.

## Manual verification checklist

- [ ] Select Jul 15 → KPIs match the Jul 15 daily report's figures.
- [ ] Switch back to today → live numbers return.

## Patches

- **2026-07-17 — loading feedback on date selection (owner request).** The
  post-selection server refetch had no visible state. `dashboard-header.tsx`
  now wraps `router.replace` in `useTransition`: while pending, the date
  button shows a spinner + "Loading…", both controls disable (opacity token
  only — no layout shift, no entrance animation), and an `aria-live` region
  announces the load for screen readers.
