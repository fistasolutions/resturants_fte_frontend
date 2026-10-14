# SPEC-072 — Daily Brief: Range + Compare KPI Filter

- **Status:** Implemented
- **Date:** 2026-08-01
- **Client request:** add the Dashboard's date-range + "Compare to" filter to
  the Daily Brief page, defaulting to "yesterday's things and today's
  things" — Today vs Yesterday.
- **Backend contract:** `ecommerce-fte-backend` SPEC-067
  (`GET /brief/kpis`) — additive, independent of the existing `GET /brief`
  payload.
- **Builds on:** SPEC-037 (`DateRangePicker`), SPEC-040 (`basePath`, reused
  across pages).

## What changes on `/brief`

A new, additive KPI section — reusing the real `DateRangePicker` component
(no copy) and the real `BriefKpis` component (parameterized, no copy).
Everything else on the page (header, decisions, overnight watch, the
existing "Yesterday at a Glance" section, coverage) is **untouched**: that
section is the fixed daily-recap ritual (yesterday vs the same weekday a
week ago), not a date-range concept.

- Default state: `range=today`, `compare=previous_period` → Today vs
  Yesterday, matching the client's plain-language ask exactly (a single-day
  `previous_period` window resolves to yesterday, per the backend's existing
  intraday rule — no special-casing needed).
- Section title: **"This Period"**, delta label taken from
  `COMPARE_MODES[compare].shortLabel` (`"vs previous period"` /
  `"vs last year"` / no badge for `"none"`) — same strings the Dashboard
  already uses, via `lib/date-range.ts`, unchanged.
- **Hidden in archive view** (`?date=...`, `isArchive === true`): archive
  mode is a frozen historical snapshot; the new section is always "live data
  vs a picked range," which would read as contradictory information sitting
  next to a frozen day. Reversible later if the client wants it always shown.
- `DateRangePicker`'s `OWNED_PARAMS` includes `"date"` — applying the new
  picker clears an active `?date=` archive param, which exits archive view
  back to live. This is expected (not a bug): the two pickers govern
  different things and adjusting one exits the other's mode.

## Contract consumed

`GET /brief/kpis?start=&end=&compare=` (backend SPEC-067) — response:
```json
{
  "period": { "start": "...", "end": "...", "compare": {"mode","start","end"} | null },
  "kpis": { /* same flat shape as yesterday_kpis */ }
}
```

## Implementation

- `types/brief.ts`: new `BriefRangeKpisResponse { period: { start: string; end: string; compare: { mode: string; start: string; end: string } | null }; kpis: BriefYesterdayKpis }` — reuses the existing flat KPI shape verbatim, no new KPI type.
- `services/brief.ts`: new `getBriefRangeKpis({ from, to, compare }): Promise<BriefRangeKpisResponse>` → `serverApi<BriefRangeKpisResponse>(\`/brief/kpis?start=${from}&end=${to}&compare=${compare}\`)` — same pattern as `services/dashboard.ts:getDashboardData`.
- `app/(app)/brief/page.tsx`:
  - `searchParams` type gains `range?`, `from?`, `to?`, `compare?` alongside
    the existing `date?`.
  - `resolveDateRange(params, todayISO)` / `resolveCompareMode(params.compare)`
    from `lib/date-range.ts` (unchanged, already generic).
  - `getBriefRangeKpis(...)` added as a third parallel fetch alongside the
    existing `Promise.allSettled([getBriefHistory, getBriefData/getBriefByDate])`
    — `Promise.allSettled` so a KPI-fetch failure degrades that one section,
    not the whole page (matches the existing error-isolation pattern here).
  - New section renders only when `!isArchive`: `<DateRangePicker>`
    (`basePath="/brief"`, `showCompare`, defaulting to today/previous_period)
    + `<BriefKpis>` fed by the range-KPI result.
- `features/brief/brief-kpis.tsx`: `BriefKpis` gains optional `title?: string`
  and `deltaLabel?: string` props, defaulting to today's hardcoded
  `"Yesterday at a Glance"` / `"vs last week"` strings — **existing call site
  (`<BriefKpis kpis={brief.yesterday_kpis} />`) is unchanged, Rule 7.** The
  new call site passes `title="This Period"` and
  `deltaLabel={COMPARE_MODES[compare].shortLabel ?? undefined}`.

## Tests

- `lib/date-range.ts` is unchanged — already generically covered by
  `tests/date-range.test.ts`; no new pure-logic tests needed.
- No new pure adapter logic is introduced (the response is consumed as-is by
  the existing `BriefKpis` rendering path), so no new Vitest file is needed
  beyond re-running the full suite (Rule 7).

### Manual verification checklist (no jsdom/component runner yet)

- [ ] `/brief` loads with the new "This Period" section showing Today vs
      Yesterday by default, above "Yesterday at a Glance."
- [ ] Changing the range/compare in the new picker updates only the new
      section — "Yesterday at a Glance," decisions, overnight watch stay
      identical.
- [ ] Opening an archived brief (`?date=...`) hides the new section and its
      picker; the archive notice still shows.
- [ ] Light and dark theme both render correctly (semantic tokens only, no
      hardcoded colors — Rule 9).
- [ ] Responsive at mobile width — picker and KPI grid don't overflow.

## Acceptance criteria

- [x] `DateRangePicker` reused unmodified, `basePath="/brief"`.
- [x] `BriefKpis` reused, parameterized, existing call site untouched.
- [x] Default state is Today vs Yesterday.
- [x] New section hidden in archive view.
- [ ] Manual checklist above verified in a running dev server.
