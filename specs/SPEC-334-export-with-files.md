# SPEC-334 — Export with files

**Status:** implemented · **Date:** 2026-10-01 · **Backend:**
`SPEC-341-strict-isolation-files-admin-restore.md` Part B · **Builds on:**
`SPEC-332-company-export-and-deletion.md`

## What

Settings → Organization → Your data → **Export everything** gains a checkbox, **Include images,
videos and files** (off by default — "a larger download"). Checked, the download link is
`/api/proxy/organizations/current/export?files=true`: the ZIP also carries every stored file
under `files/`, and each CSV cell names its file. Unchecked, behaviour is unchanged.

Pure half: `exportHref(files)` in `lib/organization-lifecycle.ts` (Vitest). The Settings doc's
Organization section says what the option adds; `updated` bumped.

## Acceptance criteria

1. The checkbox switches the link between the two URLs; the default is without files.
2. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.
