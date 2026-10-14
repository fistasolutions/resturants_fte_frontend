# SPEC-065 — Manager Notifications: drop the broadcast list (backend SPEC-057)

## Decision
Two manager-email UIs in Settings read as duplicate features. Owner decision:
keep **per-location contacts only**. The general broadcast list
(`ManagerEmailsCard`) is removed entirely — Brief's overdue/transfer sends
now route per-location on the backend (SPEC-057).

## Changes
- `features/settings/manager-emails-card.tsx` deleted.
- `features/settings/manager-notifications-card.tsx` simplified to render
  only the per-location section — no more "two purposes" framing since
  there's only one now.
- `features/settings/location-managers-card.tsx` keeps its own name/exports
  as-is (it's the surviving piece), still used standalone by the simplified
  `ManagerNotificationsCard`.
- `lib/manager-emails.ts` trimmed to `isValidEmail` (still needed) —
  `parseEmails`/`serializeEmails`/`isDuplicateEmail` deleted along with their
  tests in `tests/manager-emails.test.ts`, since they existed only for the
  deleted comma-list add/remove UI.
- `services/store.ts` — `managerEmails` dropped from `getSettingsOverview()`
  and the internal `ApiStatus` shape (backend no longer returns it).
- `app/(app)/settings/page.tsx` — `ManagerNotificationsCard` no longer takes
  a `managerEmails` prop.
- `features/brief/overdue-review.tsx` / `features/brief/transfer-review.tsx`:
  "Send All Remaining" can now partially succeed (some locations skipped for
  missing manager email) while still reporting `email_sent: true` — show the
  skip detail (`email_error`) alongside the success notice instead of only
  ever showing one message.

## Acceptance criteria
- [x] Settings has one manager-email section, not two.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green.
- [x] No dead imports/exports left from the removed comma-list helpers.

## Patches
None yet — first authored version.
