# SPEC-356 — The win-back's "Sync to Klaviyo" follows what the Klaviyo key may do

**Status:** implemented 2026-10-08 · **Repo:** frontend · **Backend:** SPEC-365
(`SPEC-365-one-klaviyo-access-answer.md`)

## What FOC sees after this change

Unchanged while its Klaviyo key can write profiles and lists (the button and the sync are as
today). If the key cannot, the button is greyed with the reason instead of marking customers
synced that Klaviyo never received.

## What changes

- `GET /brief/winback` carries `klaviyo: { can_sync, reason }` (optional — an older backend sends
  none and everything stays as today).
- `lib/winback-sync.ts` (pure): `winbackSyncGate(klaviyo)` → `{ allowed, reason }`, and
  `refusedBySync(error)` that recognises the backend's `klaviyo_winback_not_allowed` refusal.
- `WinbackSyncButton` (Customers → Win-back): disabled with the reason written beside it when the
  key cannot sync. A refusal that arrives on click (the key's power was not known yet) disables the
  button and shows the sentence, instead of a generic error and a retry.

## Acceptance criteria

1. `winbackSyncGate` returns the backend's reason; absent `klaviyo` allows.
2. A read-only key: the button is disabled with the reason; a click refused by the backend leaves it
   disabled with the sentence.
3. `npm test`, `npx tsc --noEmit`, lint on touched files, `npm run build` green.

## Verification (2026-10-08)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `winbackSyncGate` / absent allows | done | `lib/winback-sync.ts`; `tests/winback-sync.test.ts` (4 tests) |
| 2 | Read-only: disabled with reason; a click refusal holds | done | `features/brief/winback-sync-button.tsx` (gate from `klaviyo`, `SyncRefusedError` carries the code, `refusedBySync` holds the button with the sentence), wired from `features/customers/winback-page-view.tsx` |
| 3 | test / tsc / lint / build | done | `npm test` **2,490 passed**; `npx tsc --noEmit` clean; ESLint clean on touched files; `npm run build` compiled |

In-app docs (Rule 11): `lib/docs/content/customers.ts` — a Good-to-know line on the key the sync
needs; `updated` bumped.

## Patches

- **2026-10-13: the Money Finder card says when Klaviyo isn't connected.** Owner: on a store
  with no Klaviyo (Ace Rivington), the Drifting VIPs card still read "Review & sync to Klaviyo",
  promising a sync that cannot run.
  - The card reads the Klaviyo connection from the Integrations overview (already cached), only
    when the role may see integrations.
  - When Klaviyo is **not connected**, the button reads **"Review list"**, with a line under it,
    **"Connect Klaviyo to sync"**, linking to `/integrations/klaviyo?tab=settings`.
  - When it is connected, or when the connection is unknown (still loading, or a role that
    cannot see integrations), the card is as before.
  - The win-back page's own Sync button stays gated as specified above.
  - Pure rule: `winbackCardCta` in `lib/winback-sync.ts`, tested in `tests/winback-sync.test.ts`.
