# SPEC-241 — Results → Managers: who was told, who acted — and the Monday card

**Date:** 2026-09-15 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-248-manager-accountability.md`
(`GET /results/managers`, `GET /results/managers/report-card`,
`POST /results/managers/report-card/send`, `PUT /settings/manager-report-card`)
Depends on: SPEC-067 (Results page), SPEC-188 (Value Ledger tab — the tab pattern),
SPEC-069 (brief auto-send card — the toggle pattern), SPEC-230, SPEC-234 (the
manager-notifications deep link every unassigned row uses)

## Problem (HCI)

Results answers "did the send work?" per send. The owner's question is per *person*:
which manager gets told, which one acts, which store has nobody to tell. Ten tabs of
sends cannot answer that without a notebook. And every Monday he forwards store
numbers to managers by hand.

## What this builds

### 1. Results → **Managers** tab (first after Value Ledger)

```
[ 6 managers ] [ 1 with an email ] [ 5 never nudged ] [ 1 nudge · 0 worked · 1 no change ]

Manager / store        Email                      Nudges  Worked  No change  Measuring  Acts  First move  Last nudge
Jackson                fistasolutions@…           1       0       1          0          0%    —           Jul 31 · 46d ago   [Preview card]
Lawrence               No email set → Settings    0       —       —          —          —     —           never             [Preview card]
…
```

- **Summary tiles**: managers, with an email, never nudged, then nudges · worked ·
  no change (one tile).
- **Table in the backend's order** (acts-least first, then still measuring, never
  nudged, unassigned). `act_rate` renders as a percentage with the SPEC-067 verdict
  tones (`success` ≥ 60 %, `warning` otherwise, muted when null); `median_responded_hours`
  as "3.4 h" or "—"; `last_nudge_at` as date + "Nd ago" or "never". A row with no
  email shows **"No email set"** as a link to its `settings_href` (SPEC-234 focus).
- **Expand a row** to see its `latest` outcomes (the same `OutcomeRow` the other tabs
  render) and its `by_category` chips.
- **Preview card** on every *location* row (not on warehouse/support/returns — the
  card is a store's scoreboard) opens a `Dialog` with the card as data: scoreboard
  rows, "Open right now", last week's notes, the subject line — and **Send now** (a
  `force` re-send when the week was already sent, labelled "Send again"). The dialog
  reports the result in words: sent / skipped with reason / failed with reason.
- **Send all now** above the table sends to every configured manager; the result
  lists each store by name with sent / skipped / failed.
- A one-line note under the tiles: "First move = hours until the first order on a
  list shipped after the nudge; only overdue and orders lists can measure it." The
  platform sees outcomes, not replies — say so.

### 2. Settings → Automatic sending → **Monday report card** card

Same card as brief auto-send: a switch, the fixed schedule line ("Mondays 07:00
America/New_York — next Monday Sep 21"), save state. `PUT /settings/manager-report-card`.
`settingsOverview` gains `managerReportCard`.

### 3. Settings → Manager Notifications

The intro gains one sentence and a link: "Results → Managers shows who acts on what
you send." No per-row stats here — the accountability page owns them.

## Design (root Rule 9)

Tokens only; the table uses the same classes as True Profit / Brands; verdict badges
reuse `results-tabs.tsx`'s config; the dialog is shadcn `Dialog`; no entrance
animation. Stacks to one column under `sm`; the table scrolls inside its card.

## Scope

- `types/results.ts` — `owner`/`respondedHours` on `OutcomeEntry` (additive),
  `ManagerRow`, `ManagerAccountability`, `ReportCard`, `ReportCardSendResult`.
- `lib/adapters.ts` — `adaptManagers`, `adaptReportCard`, `adaptReportCardSend`.
- `lib/queries/results.ts` — `managers()`, `reportCard(locationId)`;
  `services/results.ts` — the `serverApi` faces; `services/manager-report-card.ts` —
  `sendReportCard(locationId?, force?)`, `updateManagerReportCard(enabled)` (client POST/PUT).
- `lib/manager-accountability.ts` — pure: act-rate text + tone, first-move text, last
  nudge text, the summary tiles, the send-result sentence. Vitest-covered.
- `features/results/managers-tab.tsx`, `features/results/report-card-dialog.tsx`;
  `results-tabs.tsx` + `results-view.tsx` wire the tab; `app/(app)/results/page.tsx`
  prefetches `resultQueries.managers()`.
- `features/settings/manager-report-card-card.tsx`; `settings-tab-views.tsx`;
  `lib/queries/store.ts` + `types/store.ts` (`managerReportCard`).
- `tests/manager-accountability.test.ts`; `tests/query-registries.test.ts` pins.
- `lib/docs/content/results.ts` and `settings.ts` — sections + `updated`.

## Not changed

The Value Ledger and the ten per-type tabs; the send flows themselves.

## Acceptance criteria

1. `/results` → Managers shows every active store and every configured store-level
   contact in the backend's order, with the unassigned rows linking to their Settings
   field; the tile counts equal the API summary.
2. Preview card opens the dialog with the card's scoreboard for the last completed
   week; Send now / Send again reports sent / skipped / failed in words.
3. The Settings switch persists and the schedule line shows the next Monday.
4. `npm test`, `npx tsc --noEmit`, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

Done 2026-09-15 against the live store (Playwright, frontend on :3100):

- [x] `/results` → Managers: tiles 6 / 1 with an email (5 nobody to tell) / 5 never
      nudged / 1 nudge (0 worked · 1 no change); Jackson first with 0 % acts, five
      "No email set → Settings" rows each linking to `?focus=location-<id>`.
- [x] Preview Jackson → dialog: week of Sep 7 – Sep 13, subject "Jackson — your week
      of Sep 7: health 81 (↑1), rank 1 of 4", scoreboard, 22 orders open ($8,404.20),
      "No notes went to this manager last week." Send now is wired to `POST …/send`
      (exercised in the backend tests, not fired at the live inbox today).
- [x] Settings → Automatic sending shows the Monday Report Card card, Off, with the
      "send by hand from Results → Managers" line; `settings/status` carries
      `manager_report_card`.
- [x] `npm test` 1530 passed, `tsc` clean, `npm run build` green.
- [ ] Both themes; 400 px — same table classes as True Profit; not captured today.
