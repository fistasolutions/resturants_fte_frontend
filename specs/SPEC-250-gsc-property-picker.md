# SPEC-250 — Google Search Console: pick the property, watch the first sync

**Date:** 2026-09-16 · **Repo:** frontend · **Status:** implemented
Backend counterpart: `SPEC-257-gsc-property-picker-first-sync.md` (the `properties`,
`property`, `sync` endpoints and the `needs_property` / `sync` fields on status).
Depends on: SPEC-017 (the Google connect card + callback), SPEC-230 (client data cache),
SPEC-238 (Add-provider dialog — the dialog pattern this reuses).

## Problem

Coming back from Google's consent screen ended in a green "Google Search Console
connected" banner over a property the backend had **guessed** — on 2026-09-16 it
guessed `circuleid.com` for a Ecommerce FTE account that could see eight properties —
and there was nowhere in the UI to see the list or change the choice. The first data
pull was a day away, invisibly.

Owner instruction (2026-09-16): on return from Google, **open a modal with every
property, let me choose, and that completes the connection; the first sync starts at
once and the card shows how far it has got; after that the scheduler owns it.**

## What this builds

1. **The callback lands in the picker, not a banner.** `google-callback-exchange.tsx`
   redirects to `/integrations?google=choose` when the exchange reports
   `needs_property` (always, since backend SPEC-257). The Integrations page accepts the
   new return state; the view opens `GooglePropertyDialog` once on mount for it and
   shows no banner. `connected` and `error` keep their banners.
2. **`features/integrations/google-property-dialog.tsx`** — a `Dialog` listing
   `GET /integrations/google/properties` as an accessible radio group (`role="radiogroup"`,
   one `role="radio"` button per row, arrow keys move, Enter/Space select): the
   property URL, its permission level in plain words ("Owner" / "Full" / "Restricted" /
   "Unverified — can't read search data"), a **Recommended** badge on the store's own
   site (pre-selected when present), unselectable rows disabled. Loading skeleton;
   error state with Retry; an empty state ("This Google account can't see any Search
   Console property — add it as a user in Search Console, then Refresh"). Footer:
   Cancel · **Use this property** (`PUT /integrations/google/property`) → writes the
   returned status into the cache (`setQueryData`) and closes. Cancelling leaves the
   connection in the "choose a property" state — nothing is guessed on the owner's
   behalf. The same dialog is what **Change property** on the card opens.
3. **The card knows four connected states** (`google-search-console-card.tsx`, driven by
   `status.needsProperty` and `status.sync`):
   - **needs property** — amber "Action needed" badge, a one-line explanation, primary
     **Choose property** (opens the dialog), Disconnect.
   - **sync running** — "First sync" / "Syncing" row with a `role="progressbar"` bar and
     the label `lib/gsc-sync.ts` derives (`"3 of 4 pages"`, or "Starting…" before the
     total is known); the status query polls every 2 s only while running
     (`refetchInterval` as a function of the data), never otherwise.
   - **sync succeeded** — "Last synced" as a date-time, rows pulled, next nightly run
     (04:00 UTC, stated as such); **Change property** and **Sync now** (secondary,
     `POST /integrations/google/sync`; a 409 is shown as "already running"), Disconnect.
   - **sync failed** — the error line in plain words, **Retry** (same endpoint),
     Change property, Disconnect. An interrupted run (the process restarted) reads
     "cancelled…" from the backend and is offered the same Retry.
4. **The pure half in `lib/gsc-sync.ts`** — `syncProgress(sync)` → `{ percent, label }`;
   `permissionLabel(level)`; `googleReturnState(param)` (`connected | error | choose |
   null`); `describeSync(sync)` (the one-line status copy). Vitest-covered in
   `tests/gsc-sync.test.ts` (root Rule 4 — no component runner).
5. **Types, adapter, queries, actions.** `GoogleStatus` gains `needsProperty` and
   `sync: GoogleSyncRun | null` (`types/spotlight.ts`; adapter in `lib/adapters.ts`);
   new `GoogleProperty` / `GoogleProperties`; `integrationQueries.googleProperties()`
   (`lib/queries/integrations.ts`); `getGoogleProperties`, `chooseGoogleProperty`,
   `syncGoogleNow` in `services/google-actions.ts` (the client-mutation module; gains
   `PUT`).
6. **Docs (root Rule 11).** `lib/docs/content/integrations.ts`: the OAuth sentence and
   the "how to use" step now describe choosing the property and the first sync;
   `updated` bumped. The Integrations capture still shows the pre-picker card and says
   so in the doc until the next capture run.

## Not changed

The Spotlight Visibility tab (it already reads `propertyUrl` from its own payload and
shows the estimated state until rows exist); the Meta card; the `?google=connected`
banner for a return that somehow already has a property.

## Acceptance criteria

- [x] Returning from Google opens the property dialog; no "connected" banner until a property is chosen.
- [x] The dialog lists every property, marks unverified ones unselectable, pre-selects the recommended one.
- [x] Choosing persists, closes the dialog, and the card immediately shows the first sync running with progress.
- [x] The card polls only while a sync runs; on success it shows last synced + rows, on failure a Retry.
- [x] Change property and Sync now work from the connected card.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

- [ ] Integrations → Connect Google → consent → dialog opens with the account's properties, `examplestore.com` pre-selected as Recommended, unverified rows greyed with the reason.
- [ ] Use this property → card shows "First sync · N of M pages" and a moving bar, then "Last synced …" with the row count.
- [ ] Cancel instead → card shows "Action needed · Choose property"; Choose property reopens the dialog.
- [ ] Change property → same dialog with the current choice selected; Sync now → bar, then updated time; a second Sync now during a run → "already running".
- [ ] Disconnect → card back to Connect; light and dark themes.
