# SPEC-318 — The product per organization: what one organization has, another does not see

**Repo:** frontend · **Status:** implemented (F8b in `SPEC-319-store-currency-and-timezone.md`) · **Date:** 2026-09-28
**Programme:** `SPEC-311-saas-platform-master.md`, slice **F8**
**Backend contract:** backend SPEC-319 — `GET /workspace` carries `organization.features`,
`organization.calendar_system` (`"hebrew"` or null), `store.currency`, `store.iana_timezone`; the
access check refuses a route behind a feature (`/ci` → `ci`) and a query that needs a calendar
(`compare=hebrew_year` without `calendar_system = "hebrew"` → 422 `calendar_query`).

## Why

The owner (D11/D13): FOC's own pieces — the Continuous Innovation reports, the Hebrew-calendar
comparison — stay FOC's. Another organization must not see a menu item, a picker option or a
link that the backend will refuse.

## Behaviour

- **Continuous Innovation (`/ci`)** appears only for an organization with the `ci` feature — the
  sidebar hides it and a typed URL answers "This page isn't part of your workspace" (already
  delivered by SPEC-315 from the workspace navigation; verified here, no new code).
- **The Hebrew comparison** ("Last year (Hebrew calendar)") is offered in the Dashboard's Compare
  menu only when the organization's calendar is Hebrew. For any other organization a
  `?compare=hebrew_year` URL (an old bookmark, a shared link) is read as **Last year (same
  dates)** on the Dashboard, the Morning Brief and Returns — the page loads, never a 422. The
  festival note's "Compare by Hebrew calendar" link follows the same rule.
- **One read, shared:** the layout's `/workspace` answer (SPEC-315/317) is put in a client
  context (`WorkspaceProvider`, `useWorkspace()`) for client components, and `getWorkspace()` is
  wrapped in React `cache` so a page that needs it on the server shares the layout's request —
  no added round trip.

**Not in this slice — F8b, needs its own design:** money and times still format as US dollars in
New York time (`utils/format.ts`, used by ~140 files). Formatting per store needs a formatter that
is request-scoped during server rendering (a module-level setting would leak one organization's
currency into another's page under concurrent rendering). FOC is USD / New York, so nothing
shown today is wrong; the workspace already carries `currency` and `timezone` for F8b.

## How

- `lib/date-range.ts` (pure): `compareModesFor(calendar)` — the picker's list;
  `resolveCompareMode(value, calendar?)` — with a calendar given that is not Hebrew,
  `hebrew_year` becomes `previous_year` (callers without the argument keep today's behaviour).
- `features/workspace/workspace-provider.tsx`: `WorkspaceProvider` + `useWorkspace()`; mounted in
  `app/(app)/layout.tsx` with the layout's workspace.
- `services/workspace.ts`: `getWorkspace` wrapped in `cache`.
- Callers: `app/(app)/dashboard/page.tsx`, `brief` (page and `features/brief/brief-shell.tsx`),
  `returns/page.tsx`, `features/dashboard/compare-picker.tsx`,
  `features/dashboard/dashboard-view.tsx` (the festival link).

## Tests

Vitest: `compareModesFor` (Hebrew → four modes, other/null → three); `resolveCompareMode` with a
calendar (Hebrew keeps it, null/other falls back, other values untouched, no argument unchanged).
`npm test`, `npx tsc --noEmit`, `npm run build` green. Manual: FOC sees the Hebrew option; an
organization without it does not, and `/?compare=hebrew_year` opens the Dashboard compared with
last year; `/ci` hidden without the feature.

## Acceptance criteria

- [x] `/ci` only with the `ci` feature (sidebar and typed URL).
- [x] The Hebrew comparison only on the Hebrew calendar; an old link falls back, never errors.
- [x] No added round trip.
- [x] Tests, type-check and build green.

## Verification (2026-09-28)

`npm test` 2,095 passed (185 files; 2 new cases in `tests/date-range.test.ts`); `npx tsc
--noEmit` clean; eslint clean on every touched file; `npm run build` green. `/ci` gating
confirmed against backend `policy.FEATURE_ROUTES = {"/ci": "ci"}` → the workspace navigation's
`feature` reason (SPEC-315). All four criteria done. **F8b (currency and timezone per store) is
not done** — see "Not in this slice".
