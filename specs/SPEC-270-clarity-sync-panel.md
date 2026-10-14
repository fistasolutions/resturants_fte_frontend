# SPEC-270 — Clarity card: first sync, progress, then the scheduler

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
Backend counterpart: `SPEC-270-clarity-first-sync.md` (same number by coincidence — the
repos number independently).
Depends on: SPEC-077 (configurable integration cards), SPEC-250 (the Search Console
connect flow this mirrors), SPEC-214 (Clarity surfaces).

## Problem

Saving the Clarity project id and token turns the card green and then nothing visible
happens until 04:15 UTC. Search Console got the connect flow in SPEC-250 — first sync at
once, progress on the card, then the scheduler. The owner asked for the same on Clarity.
Clarity adds two things the card must say plainly: its **10-calls-a-day budget** (a run
spends 3), and the difference between "the token was rejected", "the budget is spent"
and "Clarity has no data yet" — on 2026-09-17 the first real run returned **no data**
because the Clarity tag is not on the storefront, and a card that just said "Connected"
would have been lying by omission.

## What this builds

1. **Types + adapter.** `ClarityStatus` gains `sync: ClaritySyncRun | null` (`state`,
   `startedAt`, `finishedAt`, `records`, `done`, `total`, `error`, `reason`), `budget`
   (`used`, `limit`, `remaining`) and `nextRunUtc`; `adaptClarityStatus` maps them
   with safe defaults so a pre-270 payload still adapts.
2. **`lib/clarity-sync.ts`** — the pure half, Vitest-covered: `claritySyncProgress`
   ("2 of 3 slices"), `describeClaritySync(sync)` → tone/headline/detail with the
   four named outcomes — `no_data` → "Clarity returned no data — is the tracking tag
   on the storefront? Data appears the day after it goes live."; `unauthorized` →
   "Clarity rejected the token — generate a new one under Settings → Data export.";
   `throttled` → "Clarity's daily API budget is spent; the nightly sync runs at 04:15
   UTC."; `error` → "Clarity didn't answer — Retry."; `claritySyncPollInterval` (2 s
   while running, off otherwise); `clarityBudgetLine` ("3 of 10 calls used today ·
   2 syncs left").
3. **`features/integrations/clarity-sync-panel.tsx`** — rendered by
   `ConfigurableIntegrationCard` under the form when `provider === "clarity"` and a
   token is configured. Reads `clarityQueries.status()` (polling while running):
   running → "First sync" / "Syncing" with a `role="progressbar"` bar; success →
   "Synced · captured <date> · N rows · Next 04:15 UTC", or the `no_data` line
   (warning tone, not green); error → the named reason and **Retry**; plus **Sync now**
   (disabled while running or when fewer than 3 calls remain, with the budget line).
   `services/clarity-actions.ts` — `syncClarityNow()` (POST via the proxy), a 409 is
   shown as its message.
4. **Save starts it.** After a successful save on the Clarity card the panel's query is
   invalidated, so the run the backend started on save shows as running at once.
5. **Docs (root Rule 11).** `lib/docs/content/integrations.ts`: the Clarity line in
   `howItWorks` and the Configure section's details describe the first sync, the
   progress, the daily budget and the no-data message; `updated` bumped.

## Not changed

The generic card for every other provider; the Traffic → Website surfaces; the Search
Console card.

## Acceptance criteria

- [x] Saving both fields shows the first sync running on the card within a poll.
- [x] Success, no-data, rejected-token, spent-budget and outage read as five different states.
- [x] Sync now respects the budget and the running state; Retry is the same call.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

- [ ] Integrations → Clarity card (already saved): the panel reads "Clarity returned no
      data — is the tracking tag on the storefront?" with "3 of 10 calls used today".
- [ ] Sync now → bar "1 of 3 slices" … then the same no-data line, budget 6 of 10.
- [ ] Light and dark.
