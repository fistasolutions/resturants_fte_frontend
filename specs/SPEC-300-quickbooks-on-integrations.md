# SPEC-300 — QuickBooks on the Integrations page

**Date:** 2026-09-23 · **Repo:** frontend · **Status:** implemented
**Builds on:** `SPEC-299-finance-live.md` (the connect round trip, the query registry,
the actions) · backend `SPEC-294-quickbooks-connect-and-sync.md`
**Owner:** "add this integration in the integration page as well".

## Why

Every other connector the platform reads — Gorgias, Loop, iPacky, V-Count, Clarity,
Search Console, Meta — is connected and inspected on **Integrations**. QuickBooks was the
exception: it could only be connected from inside Finance Oversight, so the one page that
is supposed to answer *"what is this platform plugged into?"* didn't mention the books at
all, and SPEC-299 had to point the employee's set-up action away from it.

## What this adds

One card, `QuickBooksCard`, in the **Configure** section beside Meta and Search Console —
the same shape, because two integrations that behave alike should read alike.

**The one real difference from every other card: QuickBooks is not one connection.**
Lawrence, Pomona and Jackson are three separate sets of books, each with its own Intuit
realm, its own token pair and its own failure. The card is therefore a *list*, and its
badge summarises the worst state in it, not the first:

| state | badge |
| --- | --- |
| no server credentials | `Unavailable`, neutral — and no Connect button, rather than a button that fails at Intuit |
| configured, nothing connected | `Not connected`, warning |
| one or more companies need reconnecting | `1 needs reconnecting`, warning — **checked before the success case**, exactly as Meta's "Facebook only" is |
| all connected | `3 companies`, success |

A broken company must never hide behind a green badge: its bills silently stop updating,
which is the failure the whole employee exists to prevent.

Per company the card shows the name, the masked realm id, when it was last read, and — on
a broken one — the reason in amber. Each row has its own **Disconnect** (confirmed, and
the dialog says plainly that nothing in QuickBooks changes). **Connect a company** stays
available when companies are already connected, because there are three to add.

All of it is a list of rows produced by `lib/quickbooks-connection.ts` — the pure half,
where Vitest reaches it — and `features/integrations/quickbooks-card.tsx` stays
presentational, the rule `lib/meta-connection.ts` set.

## Reads and writes

Nothing new. `financeQueries.connections()` is already in the registry (SPEC-299) and
already carries `configured`; `services/finance-actions.ts` already has
`quickBooksAuthorizeUrl` and `disconnectQuickBooks`. The card invalidates `["finance"]`
after a disconnect, so the Finance page and this card never disagree.

The connect round trip is unchanged and still returns to `/employees/finance` — that is
where the payable is, and landing back on a settings page after connecting a company
would be a worse answer to "did that work?" than seeing its bills arrive.

## Files

`lib/quickbooks-connection.ts` (new, pure), `features/integrations/quickbooks-card.tsx`
(new), `features/integrations/integrations-view.tsx` (one card in the Configure grid),
`lib/docs/content/integrations.ts` (Rule 11), `tests/quickbooks-connection.test.ts` (new).
**Backend:** none.

## Acceptance criteria

1. The Configure section shows a **QuickBooks Online** card beside Meta and Search
   Console, with the same header, badge and body shape.
2. With no server credentials it reads `Unavailable` and offers no Connect button.
3. With nothing connected it reads `Not connected` and offers **Connect QuickBooks**.
4. With companies connected it lists each one — name, masked realm, last read — and a
   company needing reconnection is named in amber with the reason, and drives the badge.
5. Disconnecting a company asks first, says nothing in QuickBooks changes, and the
   Finance page agrees immediately afterwards.
6. Every rule that can be wrong is in `lib/quickbooks-connection.ts` and unit-tested.
7. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green; the Integrations
   doc names QuickBooks and its `updated` is bumped.

## Verification

Against the live backend on :8102 and the **production** frontend build on :3102.

1. **done** — the card renders in the Configure grid beside Clarity, Search Console and
   Meta, in the same header/badge/body shape
   (`ref/screens/quickbooks-integration-2026-09-23/`, light and dark, zero page errors).
2. **done** — `configured: false` renders `Unavailable` and the sentence "QuickBooks
   isn't configured on the server yet", with no Connect button. Unit-tested; on this
   machine QuickBooks *is* configured, so the live capture shows criterion 3 instead.
3. **done** — the live page reads `Not connected` with **Connect QuickBooks**, which is
   the true state of this store today.
4. **done, by unit test** — `tests/quickbooks-connection.test.ts` (12) pins all of it,
   including the one that matters: with two healthy companies and one broken, the badge
   still reads `1 needs reconnecting` in amber rather than `3 companies` in green, and the
   capability line **names** the companies that stopped. A company connected but never
   synced reads "waiting for its first read" and is **not** counted as broken. The
   connected-state capture follows once a real company is connected — nothing fake was
   written into the production database to stage a screenshot.
5. **done** — disconnect goes through the same confirmed `disconnectQuickBooks` the
   Finance page uses and invalidates the shared `["finance"]` key, so both surfaces agree
   without a reload. The dialog says plainly that nothing in QuickBooks changes.
6. **done** — every rule is in `lib/quickbooks-connection.ts`; the card holds no logic.
7. **done** — `npx tsc --noEmit` clean, `npm run lint` 0 errors (3 pre-existing warnings
   in Spotlight files), `npm test` **1921 passed in 169 files**, `npm run build` compiled.
   The Integrations doc names QuickBooks in its tagline, sources, prose, the Configure
   section and the "first ten minutes" walkthrough, with `updated` bumped to 2026-09-23.

### One thing left as it was

SPEC-299 pointed the Finance employee's set-up action at `/employees/finance` rather than
`/integrations`, and it stays there: the Connect button on the employee's own page is the
shorter path to the thing the owner wanted, and this card links to Finance Oversight
anyway. The card exists so Integrations tells the truth about what the platform is plugged
into — not to become a second front door.
