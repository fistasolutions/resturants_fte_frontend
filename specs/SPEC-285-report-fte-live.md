# SPEC-285 — Report FTE: live on the engine (mock data retired)

**Date:** 2026-09-21 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-283-report-fte-engine.md`
**Replaces the seam in:** `SPEC-256-report-fte-ui.md` ("The seam — what the backend spec
will replace"). Every read in `lib/queries/report-fte.ts` now calls `api<T>(…)`; every write in
`features/report-fte/use-report-fte-actions.ts` posts through `/api/proxy`; `lib/mock/report-fte.ts`
is deleted. The registry joins `tests/query-registries.test.ts`.

## Behaviour

1. **Desk → Build it creates a run.** "Build it" posts the ask (`POST /report-fte/runs`) and
   opens `/report-fte/composer?run=<id>`. A template card's editor has "Run now" doing the
   same from the template. `?ask=` still works as a deep link: the composer page creates the
   run on arrival and replaces the URL with `?run=`.
2. **The composer runs for real.** `ComposerData` now carries `runId` and `status`; the
   reducer starts in the phase the run is in (`ready` reopens with every section shown, `sent`
   reopens as sent). "Run the plan" opens the SSE at `POST /report-fte/runs/{id}/execute`;
   each `section` frame drops that section into the report and its call into the trace with
   its measured time; `done` sets the final draft and the status line
   ("Plan ran · N tools · 4.2 s — every figure grounded. Ready for your signature."). A
   failed tool's section says so in place. Download PDF / Excel are real links to
   `/api/proxy/report-fte/runs/{id}/pdf|excel`. Approve & send / Approve & schedule post to
   the run; the status line reports what the backend did — including "email not sent: SMTP
   not configured — recorded in Delivered" when that is the truth.
3. **Templates are saved.** The editor's one write is `PUT /report-fte/templates/{slug}`
   (sections with `on` / `narrative` / `explainLinks` / params, the two approval switches);
   the add-a-section list comes from the catalogue. "Preview with last week" → Run now.
4. **Delivered & scheduled is the log.** Rows come from `report_schedules` /
   `report_deliveries`; Pause · Turn on · Sends alone patch the schedule; a delivered row
   opens its run in the composer (which stamps `opened_at`); "What the recipient receives"
   renders the latest delivery. A "Pause every schedule" button is the kill switch.
5. **MCP tools tab owns the key.** Under the endpoint card: the owner's API keys (name,
   prefix, created, last used), "Create key" (the raw key shown once, with copy), Revoke, and
   the one-line `claude mcp add …` command with the endpoint filled in. Pure helpers in
   `lib/report-fte-keys.ts`.
6. **Profile is computed.** Scorecard, "its number", the shift and the guardrail states are
   what the backend measured; the ladder text says the rules are the owner's.
7. **Docs** (`lib/docs/content/report-fte.ts`): every "illustrative until the engine is
   connected" sentence goes; the sections describe the live behaviour; `updated` bumped.

## Implementation

- `types/report-fte.ts` — `ComposerData.runId/status`, `ApiKey`, `ApiKeyCreated`,
  `ExecuteEvent`; `ToolsData.keys`.
- `lib/queries/report-fte.ts` — loaders on `api`; `composer(runId)`; `reportFtePaths.run(id)`.
- `services/report-fte.ts` (server face) · `services/report-fte-actions.ts` (writes + the
  SSE reader `executeRun`).
- `features/report-fte/use-report-fte-actions.ts` — the hook over the actions module,
  invalidating `["report-fte"]`.
- `lib/report-fte.ts` — `initialComposerState(status, sectionIds)`, `mergeSection`,
  `statusLine`; `lib/report-fte-tabs.ts` — `composerRunHref(id)`; `lib/report-fte-keys.ts`
  — `claudeMcpCommand(endpoint, key)`, `keyLabel`.
- `features/report-fte/composer-view.tsx`, `desk-view.tsx`, `template-editor-view.tsx`,
  `templates-view.tsx`, `delivered-view.tsx`, `tools-view.tsx` (+ `api-keys-panel.tsx`),
  `report-fte-tab-pages.tsx`, `app/(app)/report-fte/composer/page.tsx`.
- Tests: `tests/report-fte.test.ts` (extended), `tests/report-fte-keys.test.ts`,
  `tests/query-registries.test.ts` (registry added).

## Acceptance criteria

1. No import of `lib/mock/report-fte` remains; the file is gone; `npm test` covers the
   registry — **done**.
2. Desk → Build it → composer opens on a real run; Run the plan fills sections in order from
   SSE frames with measured times; Approve & send / schedule and the downloads hit the
   backend — **done** (manual checklist below).
3. Editor saves; reopening shows the saved sections — **done**.
4. Delivered rows and schedules are live; authority buttons persist; pause-all works — **done**.
5. API keys: create shows the key once, list shows prefixes, revoke removes — **done**.
6. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green; doc updated — **done**.

## Manual verification checklist (no component runner — Rule 4)

- Desk → type an ask → Build it → composer shows the plan with the ask's period → Run the
  plan → sections appear one by one with real figures → Download PDF opens a PDF → Approve &
  send → status line → Delivered lists it → open it → `opened` shows.
- Templates → Trading Week → toggle a section off → Save → reload → still off → Run now.
- MCP tools → Create key → copy → `claude mcp add …` → in Claude: `list_templates`,
  `run_report` → the same draft appears under Delivered & scheduled → Delivered.
- 1440 / 400 px, light and dark: no horizontal scroll, skeleton → content without shift.
