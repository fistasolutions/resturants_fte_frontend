# SPEC-033 — Daily Report Scope Tabs (brand & location, HCI-first)

**Status:** Implemented
**Backend contract:** backend SPEC-026 (`/reports/scopes`,
`/reports/{date}?scope=`, `POST /reports/generate?scope=`), SPEC-025 margin
payloads. Owner reference: `ref/Dashboard_v2_Mockup.html` (tab rows).

## HCI decisions (owner directive: "best HCI standards")

1. **URL is the single source of truth** — `?date=YYYY-MM-DD&scope=vendor:X`.
   Shareable links, working back/forward, refresh-safe. No client tab state.
2. **Tabs are links** (RSC) with `aria-current="page"` — native keyboard
   semantics, no JS to break; each row is a labeled `<nav>` ("Filter by
   brand" / "Filter by location"). Rows scroll horizontally on overflow
   (many locations) instead of reflowing content below.
3. **Tab lists come from `/reports/scopes`** — never hardcoded (the mockup's
   hardcoded brands violated this; the real store's vendors/locations render).
4. **Honest empty state + explicit generation:** a scoped tab with no cached
   report explains that, and offers one clearly-labeled action ("Generate
   this view"), `aria-busy` while running, inline error with
   `aria-live="polite"`, disabled during flight — no dead spinners, no
   auto-firing LLM calls on tab hover/click.
5. **Margin honesty in UI:** margin tiles always show the coverage badge
   ("based on N% of revenue"); when margin is null it renders as an explicit
   "No cost data in this slice" — never 0%.
6. **Perceived speed:** `loading.tsx` skeleton mirrors the final layout
   (zero layout shift); content renders in final position (Rule 9 — no
   entrance animation).
7. Hit targets ≥ 32px; both themes token-only; print path untouched.

## Files

`lib/report-scope.ts` (+ unit tests `tests/report-scope.test.ts`),
`types/reports.ts`, `services/reports.ts`,
`features/reports/scope-tabs.tsx`, `features/reports/scoped-report-view.tsx`,
`features/reports/generate-report-button.tsx`,
`app/(app)/reports/page.tsx`, `app/(app)/reports/loading.tsx`.

## Acceptance Criteria

1. `lib/report-scope.ts` validation/label logic unit-tested (valid scopes,
   junk rejected, labels humanized).
2. All-brands tab renders the existing ReportViewer unchanged (Rule 7).
3. Scoped tab: cached report renders KPI row + margin-with-coverage + top
   products + AI narrative; uncached shows the generate affordance.
4. Four gates green (vitest, tsc, lint, build).
5. Manual HCI checklist: keyboard-only pass (tab through both rows, activate,
   generate), both themes, mobile (tab rows scroll), print.
