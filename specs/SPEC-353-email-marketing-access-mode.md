# SPEC-353 — Email Marketing screens follow the Klaviyo key's access

**Status:** implemented 2026-10-08 · **Repo:** frontend · **Backend:** SPEC-362
(`SPEC-362-klaviyo-access-mode.md`)

## What FOC sees after this change

Unchanged (FOC has not connected this employee).

## What changes

- `lib/email-access.ts` (pure): `accessGate(access, action)` → `{ allowed, reason }` for `send`,
  `flows`, `audiences`; an older backend without `access` allows everything (today's behaviour).
- Every write button — Send a test, Approve and send, Build it as a draft, Turn on, edit a flow
  message, Sync to Klaviyo — is shown **disabled with the reason written next to it** when the key
  does not allow it (enterprise practice: the action exists, the account cannot use it yet).
- A one-line banner on the Email Marketing page for a read-only or partial key: "Read-only Klaviyo
  key — your Email Marketing Manager advises; to let it prepare and send, give it a key with full
  access on Integrations."

## Acceptance criteria

1. `accessGate` returns the backend's reason per action and allows all when `access` is absent.
2. Read-only: every write button disabled with its reason; full: unchanged.
3. `npm test`, `npx tsc --noEmit`, lint on touched files, `npm run build` green.

## Verification (2026-10-08)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `accessGate` per action; absent `access` allows all | done | `lib/email-access.ts`; `tests/email-access.test.ts` (8 tests: older backend, read-only, partial, fallback sentence, full, banner) |
| 2 | Read-only: write buttons disabled with the reason; full unchanged | done | `pre-send-panel.tsx` (Send a test, Approve — the reason replaces the status line), `flows/flow-detail-view.tsx` (Build, Turn on, Set to manual, message save), `audiences/audiences-tab.tsx` (Sync), `approvals/approvals-tab.tsx` (Approve and turn on, keyboard shortcut included); banner in `status-strip.tsx` with a link to Integrations. A full key reads `canX: true`, so every condition is a no-op |
| 3 | test / tsc / lint / build | done | `npm test` **2,471 passed** (219 files); `npx tsc --noEmit` clean; ESLint clean on every touched file; `npm run build` compiled |

Manual check (no component runner): with a read-only key connected, the strip shows "Read-only
Klaviyo key." and every write button above is greyed with the sentence beside it; Overview, Plan,
Performance and Chat read as before.

In-app docs (Rule 11): `lib/docs/content/email-marketing.ts` — the connection section says what a
read-only key does, a Good-to-know line on access, the autopilot line names the key.
