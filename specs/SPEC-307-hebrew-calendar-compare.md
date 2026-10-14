# SPEC-307 — Compare the Dashboard with the same festival last year

**Status:** implemented · **Date:** 2026-09-25 · **PBIs:** 23 and 27.
**Backend:** SPEC-305 (`compare=hebrew_year`; `period.compare` carries `festivals`,
`compare_festivals`, `aligned`). **Builds on:** SPEC-031/037 (range + compare), SPEC-230.

## Problem

The Dashboard compares only with the previous period — there is no way to choose a
comparison in the UI at all (the mode is a URL parameter nobody sees). And "last year" on
Gregorian dates is wrong for a store whose demand follows the Hebrew calendar: the week of
Pesach 2026 (2 April) against 2 April 2025 is Pesach against the week before Pesach.

## What changes

1. **A comparison picker** next to the date picker on the Dashboard: Previous period ·
   Last year (same dates) · Last year (Hebrew calendar) · No comparison. It writes
   `?compare=` and keeps the range; the date picker keeps `compare` (it only owns range
   params).
2. **`hebrew_year` is a compare mode** in `lib/date-range.ts` (label "Last year (Hebrew
   calendar)"). Its dates cannot be worked out in the browser, so:
3. **The comparison label uses the window the backend actually compared**
   (`period.compare.start/end`) for every mode, falling back to the local mirror only for an
   older backend — the label can never disagree with the numbers.
4. **The festival note** under the KPI strip, from `period.compare` (pure wording in
   `lib/calendar-note.ts`):
   - both windows hold the same festivals → "This range includes Pesach — compared with
     13–20 Apr 2025, which also held Pesach."
   - they differ → "This range includes Pesach, but 2–9 Apr 2025 held no festival — the
     comparison isn't like for like." with **Compare by Hebrew calendar** (a link setting
     `compare=hebrew_year`) unless that is already the mode.
   - neither holds a festival → nothing is shown.
5. The revenue chart's second line is labelled for the mode ("Same Hebrew dates last year").
6. **In-app docs:** the Dashboard doc describes the picker and the note (Rule 11).

## Acceptance criteria

1. The picker offers the four modes, shows the current one, and changing it refetches only
   the dashboard data with the range unchanged.
2. `compare=hebrew_year` shows KPI deltas "vs <the backend's dates>" and the festival note.
3. A Gregorian "last year" around a festival shows the not-like-for-like note and the
   switch; after switching, the note says the windows match.
4. `lib/calendar-note.ts` and the date-range changes are unit-tested.
5. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green; light, dark and
   390 px checked.

## Verification

Run 2026-09-25 against the **real store** (backend :8102, production build :3102), Pesach
2025 (12–20 April), light, dark and 390 px.

1. **done.** The Compare menu lists Previous period · Last year (same dates) · Last year
   (Hebrew calendar) · No comparison; picking one keeps the range
   (`?from=2025-04-12&to=2025-04-20&compare=none` after "No comparison").
2. **done.** Hebrew calendar: KPI deltas read "vs Apr 22 – Apr 30, 2024" (Pesach 2024) and the
   note "This range includes Pesach — compared with Apr 22 – Apr 30, 2024, which also held
   Pesach." Revenue −61.1% against the same festival.
3. **done.** Same dates last year: "This range includes Pesach, but Apr 12 – Apr 20, 2024 held
   no festival — the comparison isn't like for like." with Compare by Hebrew calendar (that
   window was the peak week before Pesach 2024: revenue −98.5%). The switch took 6.9 s — the
   dashboard's own refetch from this laptop, the same as any range change; the note then says
   the windows match. "No comparison" removes the note.
4. **done.** `tests/calendar-note.test.ts` (window dates from the backend's end, the three note
   cases, the switch only when it changes the answer, festival lists, the four modes, the href
   keeping every other parameter). The chart's second line is named for the mode.
5. **done.** `npm run lint` 0 errors (3 pre-existing warnings), `npx tsc --noEmit` clean,
   `npm test` 176 files / 2,005 tests, `npm run build` compiled; 390 px `scrollWidth` 390; no
   page errors. Dashboard doc updated (`updated` 2026-09-25).

Not in scope and not built: a compare picker on the Morning Brief (its comparison anchors the
decision cards to a saved snapshot); the Brief, Loop and Gorgias endpoints accept the mode.
