# SPEC-108 — "Export PDF" button on the report (D-06)

## Context / Why

Backend SPEC-107 adds `GET /reports/{date}/pdf` — a real generated PDF of the stored
executive report. This spec adds the **Export PDF** button that downloads it, distinct
from the existing browser Print button.

## Scope

- **`ExportPdfButton`** (`features/reports/export-pdf-button.tsx`, `"use client"`) —
  fetches `/api/proxy/reports/{date}/pdf?scope=` (the proxy injects auth + streams the
  binary through untouched), reads the blob, and triggers a client-side download named
  `report-{date}.pdf`. On failure it silently re-enables (the on-screen report is
  unaffected). Loading spinner while fetching.
- Rendered in `ReportV2View`'s header next to Print, **only for stored daily reports**
  (`periodLabel === "daily"`) — weekly/monthly rollups are live/unstored, so there's no
  stored PDF to export.
- The old browser button is relabelled **"Print"** (was "Print / Save PDF") so the two
  actions read distinctly.

## Design compliance (Rule 9)

Uses the shadcn `Button` (outline/sm), Lucide icons, `print:hidden`; semantic tokens;
no Framer Motion / entrance animations (only the spinner while downloading).

## Tests (Rule 4)

No new pure logic (the download is a browser API side-effect); verified via the manual
checklist below (no jsdom runner). Type-safety covered by `tsc`.

## Manual verification checklist

- [ ] Daily report: "Export PDF" downloads `report-<date>.pdf`; opening it shows the
      same figures as the page (financials, same-store, top styles, store performance).
- [ ] Button shows a spinner while generating, re-enables after.
- [ ] Weekly/Monthly rollup: no Export PDF button (only stored reports export).
- [ ] Backend down / 404: button re-enables, report still on screen.
- [ ] Light + dark themes; button hidden in the print view.

## Acceptance Criteria

- [ ] Export PDF downloads the backend-generated PDF for stored daily reports.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Patches

- **2026-08-11 — Export PDF for all periods, remove Print (client).** `ExportPdfButton`
  gained a `period` prop and now hits `/api/proxy/reports/{date}/pdf?scope=&period=`,
  downloading `report-{period}-{date}.pdf` — so it exports **daily, weekly, and
  monthly** (weekly/monthly use the live-rollup PDF). In `ReportV2View` the button is
  always shown (no more daily-only gate) with `period={periodLabel}`. The **browser
  "Print" button was removed** (`print-button.tsx` deleted) from both `ReportV2View`
  and the legacy `ReportViewer` — Export PDF is now the single, real export.
