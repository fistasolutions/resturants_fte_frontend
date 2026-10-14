# SPEC-332 — Your data: export everything, delete the organization, restore it

**Status:** implemented · **Date:** 2026-10-01 · **Repo:** frontend · **Backend:**
`SPEC-340-tenant-hardening-rls-export-delete.md` (Parts B and C) · **Builds on:** SPEC-324
(Settings panels), SPEC-312 (auth screens)

## Why

Backend SPEC-340 lets an organization take its data away and delete itself, with a 30-day
grace (owner decisions 2026-10-01: grace then purge; billing kept anonymised; ZIP of CSVs).
This is the owner's door to both, and the public page the restore link opens.

## What

### Settings → Organization → "Your data" (owner only)

A second panel under the Organization panel, `tone="danger"`, shown only when the member is
the owner (`isOwnerAccess`). Two rows:

- **Export everything** — "A ZIP of CSV files: every store's data, your members, plan
  history and chats. Passwords and keys are never included." A plain download link to
  `/api/proxy/organizations/current/export` (the browser streams it to disk; nothing is
  held in page memory). The proxy now passes `content-disposition` through, so the file keeps
  the backend's name (`<slug>-export-<date>.zip`).
- **Delete organization** — opens an alert dialog:
  - What happens: locked now for everyone; erased on the date 30 days out; billing history
    kept anonymised; plan cancelled; a restore link by email and on screen.
  - "Type **<organization name>** to confirm" — the Delete button stays disabled until the
    typed text matches (`confirmationMatches`, the backend's rule: case and spacing ignored).
  - On success the dialog shows the date and the restore link (with Copy), says whether it
    was emailed, and offers **Sign out** — every request after this answers 403.
  - Errors show the backend's own words (`ApiError`).

### `/restore?token=…` (public)

Open signed in or not (added to `OPEN_ROUTES`). Explains what restoring does, one
**Restore organization** button → `POST /auth/organization-restore`. Success: "Restored —
sign in, then choose a plan" with a link to `/login`. `restore_expired` (410): "This link has
expired or was already used." A missing token renders the expired state without a request.

### Pure half — `lib/organization-lifecycle.ts`

`EXPORT_PATH`, `confirmationMatches(typed, name)`, `purgeDateLabel(iso)`,
`restoreFailureMessage(code)`, `deletionFrom(api)` (snake → camel). Vitest-covered.

### In-app docs (root Rule 11)

`lib/docs/content/settings.ts`: the Organization section describes "Your data" (export,
delete with 30-day grace, restore by link); `updated` bumped.

## Acceptance criteria

1. The "Your data" panel appears for the owner only.
2. Export is a link that downloads the ZIP with the backend's file name.
3. Delete stays disabled until the organization's name is typed; success shows the date and
   a working restore link; a failure shows the backend's message.
4. `/restore?token=…` restores and points to sign-in; an expired link says so.
5. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Manual verification

- Owner vs non-owner on Settings → Organization (panel present / absent), light and dark.
- Delete dialog: keyboard (Tab, Escape), disabled state, success state, copy.
- `/restore` signed out: restore, then expired on a second click.
