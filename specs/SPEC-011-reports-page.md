# SPEC-011 — Executive Reports Page

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (PRD §3 Daily Executive Report; Design.md §21 Reports layout)

## Goal

`/reports`: browse daily executive reports — date selection, summary cards, and the
AI-written report body (Markdown, per PRD) — mock-backed via `services/reports.ts`.

## Scope

- **Types** `types/reports.ts`: `ExecutiveReport { id, date (ISO), title,
  summary: ReportMetric[] (label/value/changePercent), markdown }`.
- **Mock** `lib/mock/reports.ts`: 3 daily reports (May 15/14/13, 2026) with realistic
  Markdown bodies (revenue, orders, AOV, customers, top/worst products, inventory
  alerts, refunds, discounts sections) consistent with dashboard numbers.
- **Service** `services/reports.ts`: `getReports()`, `getReport(date)` — Phase 8
  swaps to the backend reports API (same signatures; backend generates the Markdown).
- **Markdown rendering**: `react-markdown` (no raw HTML — safe by default) with a
  token-styled component map (`features/reports/report-markdown.tsx`) — headings,
  lists, tables, strong/em all themed from globals.css. No typography plugin.
- **Components** (`features/reports/`): `report-picker.tsx` (client — Select of
  available report dates, URL-driven `?date=`), `report-summary.tsx` (metric cards
  row reusing the KPI delta pattern), `report-markdown.tsx`, page composes them.
- **Export** (PDF/CSV) is PRD Coming Soon → disabled `ComingSoonButton`.
- Nav `Reports` enabled.

## Acceptance Criteria

1. `/reports` shows the latest report by default; picking a date updates URL + view.
2. Summary cards + fully styled Markdown body render from mock data; tokens only.
3. Export button present but honestly disabled (Coming soon tooltip).
4. Invalid `?date=` falls back to the latest report.
5. Lint, tsc, tests, build green.

## Patches

- **2026-07-15 (quick fix — live-API empty DB crash).** After SPEC-015 went live,
  a store with **no generated reports yet** (the 06:00 UTC job hasn't run) made
  `getReport()` return `undefined` (`reports[0]` of an empty list), crashing the
  page at `report.date`. Fix: `services/reports.ts` drops the redundant
  `getReport()` (its only caller was this page, and it re-fetched the whole list —
  double work per view); the page now calls `getReports()` once, derives
  `report = find(?date) ?? latest ?? null`, and renders a proper empty state
  ("first report generates automatically…") when `null` — per the root rule that
  every view ships loading/empty/error states. Invalid/unknown `?date=` still
  falls back to the latest (AC 4 unchanged, now via `find`).
