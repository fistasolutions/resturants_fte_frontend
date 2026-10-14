# SPEC-069 — Brief Auto-Send Settings Card

## Problem

Backend SPEC-065 adds an unattended scheduler job that sends every
pending Overdue/Transfer/Winback/Dead-Inventory sheet at a configured
time, gated by `stores.brief_auto_send_enabled` +
`stores.brief_send_time`. There is no UI for it yet — the client needs
to turn it on/off and pick the time from Settings, with the same
polish and honesty as the existing Report Schedule card.

## Design

One new card, same shape and placement conventions as
`ReportScheduleCard` (`features/settings/report-schedule-card.tsx`),
placed directly below it in `app/(app)/settings/page.tsx`.

- **shadcn `Switch`** (not yet installed in this repo — add via
  `npx shadcn add switch`) for on/off, paired with a `time` `Input`
  that's only meaningfully editable — greyed via `disabled` — while
  the switch is off, per Design.md's form-state conventions (label /
  disabled / loading / success states, §12).
- **Plain-language status line**, not just raw data — this is the one
  place in Settings that most needs to read as a sentence, not a
  field, because the whole point of the feature is "will this run
  without me":
  - ON: "Sends automatically at **08:00 America/New_York** — next run
    **{formatted next run}**."
  - OFF: "Off — you must click Send in Morning Brief yourself."
- Toggling the switch on with no time chosen yet defaults the input to
  `07:00` (client's own stated example), never submits empty.
- Save button + saved/error states identical to `ReportScheduleCard`
  (loading spinner, `role="status"` success check, `role="alert"`
  error) — same component family, same accessibility guarantees, no
  new pattern invented.
- Token-only styling (root Rule 9) — no hardcoded colors; the ON/OFF
  status line uses `text-muted-foreground`, not a bespoke color.

## Data flow

- `types/store.ts` — new `BriefAutoSendSchedule` interface: `{
  enabled: boolean; time: string; timezone: string; nextRunAt: string
  | null }`.
- `services/store.ts` — `ApiStatus` gains `brief_auto_send`;
  `getSettingsOverview()` returns `briefAutoSend`.
- `services/brief-auto-send.ts` (new) — `adaptBriefAutoSend()` +
  `updateBriefAutoSend(enabled, time)` — `PUT
  /api/proxy/settings/brief-auto-send`, mirrors
  `services/report-schedule.ts` exactly.
- `features/settings/brief-auto-send-card.tsx` (new) — the card
  itself, client component (interactive switch + form).

## Acceptance Criteria

- [x] `BriefAutoSendCard` renders with the switch reflecting
      `schedule.enabled`, time input reflecting `schedule.time`,
      disabled while off.
- [x] Toggling on with an empty/never-set time defaults to `07:00`
      before the first save.
- [x] Save calls `PUT /settings/brief-auto-send` with `{enabled,
      time}` and updates the card from the response — loading /
      saved / error states all present.
- [x] Status line reads as a plain sentence, correct for both on and
      off states, including the store's real timezone.
- [x] `npx tsc --noEmit` clean, `npm run lint` clean on every file this
      spec touched (4 pre-existing errors remain elsewhere, unrelated
      to this change), `npm test` 227/227 green, `npm run build`
      green — `/results` and every other route compiles; card added to
      `app/(app)/settings/page.tsx` right below `ReportScheduleCard`.
      Live-verified: `GET /settings/status` against the real backend
      returns `brief_auto_send: {enabled: false, time: "07:00",
      timezone: "America/New_York", next_run_at: null}` — the real
      store's actual timezone, before it's ever been turned on.
