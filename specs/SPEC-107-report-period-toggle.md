# SPEC-107 — Reports Daily/Weekly/Monthly period toggle (D-08)

## Context / Why

Backend SPEC-106 adds `GET /reports/rollup?period=weekly|monthly` — the report sections
aggregated live over a trailing 7/30-day window (never stored, always fresh). This spec
adds a **Daily / Weekly / Monthly** toggle to `/reports` that renders those rollups
using the existing `ReportV2View`.

## Scope (`/reports`, store-wide "all" scope only)

- `PeriodToggle` client component — URL-driven (`?period=`), "daily" is default and drops
  the param (mirrors `ScopePicker`). Shown only when `scope === "all"` (rollups are
  store-wide).
- Page reads `period`; for **weekly/monthly** it fetches `getReportRollup(period, date?)`
  and renders `ReportV2View` from a synthesized `ReportDetail` (`content_md: ""` → no AI
  prose; `generated_by: "fallback"` → header reads "deterministic"), **skipping** the
  per-date stored fetch (Rule 5). **Daily** is unchanged (the stored report).
- `ReportV2View` gains optional `periodLabel` ("daily" default → "weekly"/"monthly" in
  the section headers) and `periodNote` (a banner describing the rollup window). Daily
  passes neither — byte-identical to before (Rule 7).
- Types: `ReportPeriod`, `ReportRollup`; service: `getReportRollup`.

## Design compliance (Rule 9)

Semantic tokens only; no Framer Motion / entrance animations (toggle is instant, buttons
use CSS hover/focus only); reuses `ReportV2View`; keyboard-navigable toggle; responsive.

## Tests (Rule 4)

`tests/report-period.test.ts` — pure logic: `normalizePeriod` maps
weekly/monthly/other→daily. The view/toggle ship with the manual checklist (no jsdom).

## Manual verification checklist

- [ ] `/reports` (scope all): toggle shows Daily/Weekly/Monthly; Daily = stored report.
- [ ] Weekly/Monthly: banner + rolled-up totals; section headers say "weekly"/"monthly".
- [ ] Same-store + Top-10 sections reflect the wider window.
- [ ] Scoped (brand/location) view hides the toggle and stays daily.
- [ ] Light + dark; mobile/tablet/desktop; no horizontal scroll.

## Acceptance Criteria

- [ ] Weekly/Monthly render live rollups; Daily unchanged.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Patches
(none yet)
