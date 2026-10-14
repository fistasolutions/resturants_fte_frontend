# SPEC-303 — A progress bar per QuickBooks company

**Status:** implemented · **Date:** 2026-09-24 · **Owner request:** "Add a progress bar per
company on Integrations while each first sync runs."
**Backend:** SPEC-298 (`sync` on every connection, `syncing` on the list). **Builds on:**
SPEC-300 (the QuickBooks card on Integrations), SPEC-299 (the Intuit callback), SPEC-301.

## Problem

After connecting a company the Integrations card says "waiting for its first read" and
nothing moves until the numbers appear. Connect three companies one after another and the
owner cannot tell which is being read, which are waiting, or whether anything is happening.
And the Intuit callback always lands on Finance Oversight, so a connect started from
Integrations never comes back to the card it started from.

## What changes

1. **Types and adapter.** `QboConnection.sync: QboSync | null`
   (`state` queued | running · `step` · `steps` · `label` · `startedAt` · `first`) and
   `ConnectionsOverview.syncing`. An older backend without them adapts to `null` / `false`.
2. **`lib/quickbooks-connection.ts` (pure, tested):** `syncProgress(row)` — the percent
   (queued = 0, running = step ÷ steps), the label from the backend, "Step 4 of 7", and
   "First read" vs "Reading" — `connectionsPollInterval(overview)` (2 s while `syncing`,
   off otherwise), and `returnPathFor(value)` — the callback's allowlist.
3. **The bar** — `features/integrations/qbo-sync-bar.tsx`: company name, what it is doing
   ("Reading open bills"), "Step 4 of 7", and a thin bar (`role="progressbar"` with
   `aria-valuenow`), tokens only; a queued company shows an empty bar with "Waiting for its
   turn". It replaces that company's one-line detail on the Integrations card while its
   read runs, and appears in the Finance Oversight connection strip the same way.
4. **Polling, only while something runs.** Both surfaces read the ONE connections query
   (`financeQueries.connections()`) with `refetchInterval` from
   `connectionsPollInterval` — one light read every 2 s while `syncing`, nothing otherwise.
   When `syncing` goes from true to false the finance cache is invalidated, so the payable
   the read just brought in shows without a reload.
5. **Back to where the connect started.** Connect on Integrations sets a short-lived
   `qbo_return=/integrations` cookie (15 min, `SameSite=Lax`); the callback route reads it,
   accepts only `/integrations` or Finance Oversight (`returnPathFor` — never an arbitrary
   URL), clears it and redirects there with the same `connected` / `qbo_error` /
   `qbo_cancelled` parameters. Connect from Finance Oversight clears it.
6. **The Integrations card reads those parameters:** "Lawrence connected — reading its
   books now." (success tone), the error sentence, or "Connection cancelled — nothing
   changed.", so the round trip never ends silently.
7. **In-app docs:** the Integrations doc's QuickBooks section says what the bar shows;
   `updated` bumped.

## Out of scope

A percentage inside a step (Intuit's paging is not counted in advance), server-sent events.

## Acceptance criteria

1. After a connect from Integrations the owner lands back on Integrations with a
   "connected" line and that company's bar showing "Waiting for its turn" or its step.
2. With several companies, each has its own bar: one running, the others waiting.
3. The bar advances without a reload, and polling stops once no company is syncing.
4. When the read finishes the bar is gone, the row reads "read just now", and Finance
   Oversight shows the new bills without a reload.
5. The callback never redirects anywhere but Integrations or Finance Oversight.
6. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Verification

Run 2026-09-24. No real Intuit connect is possible yet (development keys only reach sandbox
companies), so the live check ran on the scratch copy of the app (SQLite, :8103 → production
build :3103) with a script walking the three companies' sync columns exactly as
`FinanceSyncService` writes them: all queued, then each company through steps 0–6 in turn,
then cleared with `last_synced_at`. Nothing was written to the production database.

1. **done.** Landing on `/integrations?connected=Lawrence` shows "Lawrence connected —
   reading its books now." and a bar per company, "Waiting for its turn" / "In line".
   The callback's return path was checked with curl: cookie `/integrations` →
   `/integrations?qbo_cancelled=1`; a forged `https://evil.example.com` → Finance
   Oversight; no cookie → Finance Oversight; the cookie is cleared every time.
2. **done.** Sampled each second: Jackson running (0 → 14 → 57 → 71 → 86 %) while Lawrence
   and Pomona sat "Waiting for its turn"; then Lawrence, then Pomona.
3. **done.** 15 reads of `/finance/connections` during the ~30 s run (every 2 s), **0** in
   the 8 s after the last bar cleared. Found while verifying: a page opened before a run
   started never began polling — "Sync now" now re-reads the connections 800 ms after it
   starts (`SYNC_PEEK_MS`), so its bars appear too — built and type-checked, **not exercised
   live** (the scratch stack cannot reach Intuit). A connect needs no peek: the backend marks
   the company queued before the owner lands. Known limit: the hourly read on a page that
   was already open when it began shows no bar until the page is next opened.
4. **done.** Every bar gone at the end on both surfaces; the Finance Oversight strip showed
   the same three bars (light and dark captured) and refreshed without a reload.
5. **done.** `returnPathFor` allowlist, unit-tested and checked live (above).
6. **done.** `npm run lint` 0 errors (3 pre-existing Spotlight `<img>` warnings),
   `npx tsc --noEmit` clean, `npm test` 172 files / 1,966 tests passed, `npm run build`
   compiled. Integrations doc updated (`updated` 2026-09-24).

Also fixed while verifying: the running bar read "Reading — Reading b…" on the narrow card —
the label now sits on its own line under the bar.
