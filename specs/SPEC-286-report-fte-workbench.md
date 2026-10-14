# SPEC-286 — Report FTE workbench: the ask, the composing skeleton, the arranged report, history, and editing by chat

**Date:** 2026-09-21 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-284-report-fte-history-and-revisions.md`
**Builds on:** SPEC-285 (live), SPEC-256 (the surface)
**Owner asks (2026-09-21, six points):** hide the MCP surface for now; the Desk's ask
box must be a proper prompt composer with room above it; Build it must move straight to
the Composer and show a report-shaped skeleton while planning; while composing, every
pending section is a skeleton of what is coming, and the finished report is *arranged*
like a professional report (not tiles → table → tiles), with a button to open it full;
the side columns stay fixed while the middle scrolls (custom scrollbar when a column
overflows); a proper history of every report with CRUD, and a chat to edit a generated
report.

## Behaviour

1. **MCP is not in the app for now.** The `MCP tools` tab, its route, the tool
   catalogue view, the key panel and their helpers are removed; the backend keeps the
   server and the key API. The doc loses the section and says so in one line.
2. **The Desk opens on the ask.** Room above (`pt-6 md:pt-10`), a centred prompt block
   (`max-w-3xl`): eyebrow, "What report do you need?", a multi-line `Textarea` inside
   the rounded card with the notebook mark, a footer with the hint "Enter to build ·
   Shift+Enter for a new line" and **Build it**; example asks as chips beneath; the
   templates, the delivery lists and the employee card follow below.
3. **Build it goes straight to the Composer.** The Desk pushes `/report-fte/composer?ask=…`
   at once (the route's `loading.tsx` is the first paint), and `ComposerStarter` renders
   the **planning skeleton** — the three columns as the report will be (plan blocks,
   a report page with a KPI strip, a table and narrative lines, the trace) with the
   status "Reading your ask and choosing the report's shape…" — while it creates the
   run, then replaces the URL with `?run=<id>`. `?autorun=1` on the composer starts
   the run on arrival (used after a revision).
4. **Composing shows the shape of what is coming.** A pending section is a skeleton
   of its planned kind (four tiles · a six-row table · bars · three narrative lines)
   headed by its title and tool with "computing…"; it is replaced in place by the real
   section when its frame lands.
5. **The report is arranged, not listed.** `lib/report-layout.ts` `arrangeReport`
   builds the reading order from the composed sections: **In brief** (the narrative's
   bold lead, when it exists) → **Headline figures** (every KPI block, as one strip
   with each block captioned by its section) → **Charts** (bars) → **Tables** (each
   with its caption and note) → **What to do** (the narrative). Pending skeletons
   take the same places. `ReportDocument` renders that arrangement; the composer's
   middle column and the full page both use it. **Open full** (in the report's
   header) goes to `/report-fte/reports/[runId]` — a bare, reading-width document
   page with its own header (back, title, meta, Download PDF / Excel, Open in
   Composer) and the revision chat beside it.
6. **Fixed sides, scrolling middle.** At `xl` the plan column and the trace/deliver
   column are `sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto
   scrollbar-subtle`; the report scrolls with the page.
7. **History is a tab** (`/report-fte/history`, in the MCP tab's place): every run
   newest first — title, kind, status, when, cost, acted on, delivered to — with
   **Open** (composer), **View** (full page), **Duplicate**, **Rename** (inline),
   **Delete** (confirm). Backed by `GET /report-fte/runs` and the three writes.
8. **Ask for a change.** `RevisionChat` (composer right column, under Deliver; and on
   the full page) shows the run's revisions as a thread and takes a message: "only the
   top 10 brands", "30 days", "drop the returns table", "add refund reasons", "focus
   the summary on MIRAGE". It posts to `revise`; the reply lands in the thread with
   the list of changes; when something changed the composer runs the plan again at
   once (the full page navigates to the composer with `autorun=1`).

## Implementation

- Removed: `app/(app)/report-fte/tools/`, `features/report-fte/tools-view.tsx`,
  `api-keys-panel.tsx`, `lib/report-fte-keys.ts`, `tests/report-fte-keys.test.ts`, the
  `tools` query and path, `ToolsData/ApiKey*` types, the `TOOL_FILTERS/filterTools/
  countTools` helpers and their tests, the tab entry.
- Added: `app/(app)/report-fte/history/` (+ loading), `app/(app)/report-fte/reports/[runId]/`
  (+ loading), `features/report-fte/history-view.tsx`, `report-document.tsx`,
  `pending-section.tsx`, `planning-skeleton.tsx`, `revision-chat.tsx`,
  `report-page-view.tsx`, `lib/report-layout.ts` (+ test), `lib/report-fte-history.ts`
  (+ test).
- Changed: `desk-view.tsx`, `composer-view.tsx`, `report-fte-tab-pages.tsx`,
  `report-fte-shell.tsx` (the report page is bare), `lib/report-fte-tabs.ts`
  (`history`, `reportPageHref`, framed routes), `lib/queries/report-fte.ts`
  (`history`, `run` unchanged), `services/report-fte-actions.ts` (rename · delete ·
  duplicate · revise), `use-report-fte-actions.ts`, `types/report-fte.ts`
  (`Revision`, `RunSummary`, `HistoryData`, `ReviseResult`), the doc.

## Acceptance criteria

1. No `/report-fte/tools` route, no MCP tab, no dead helper — `npm test` and `tsc`
   green — **done**.
2. Desk: the prompt block with room above; Enter builds, Shift+Enter breaks a line;
   Build it lands on the composer's planning skeleton, then the plan — **done**
   (manual checklist).
3. Composing: pending skeletons shaped by kind, replaced in place; the finished report
   arranged In brief → Headline figures → Charts → Tables → What to do;
   `arrangeReport` unit-tested — **done**.
4. Open full shows the document page with downloads and the chat — **done**.
5. Sides sticky at `xl` with the subtle scrollbar when they overflow — **done**.
6. History lists runs; rename, duplicate and delete work and refresh the list — **done**.
7. A revision message returns a reply in the thread and re-runs the plan — **done**.
8. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green; doc updated,
   screens recaptured — **done**.

## Manual verification checklist (no component runner — Rule 4)

- Desk at 1440 / 400 px, light and dark: the prompt block sits with room above, chips
  wrap, Enter builds.
- Build it → planning skeleton → plan; Run the plan → skeletons → sections land in
  their arranged places; Open full → document page; back.
- Composer at 1440: scroll the report — the plan and the trace stay put; a long plan
  scrolls inside its column with the thin scrollbar.
- History: rename inline, duplicate opens a new draft, delete asks and removes.
- Chat: "only the top 10 brands" → reply names the change → the plan re-runs with
  `limit=10` in the trace.

## Patches

### 2026-10-02 — side columns clipped; only the report scrolls (quick fix, owner request)

- **Clipped cards:** the trace/deliver column was a height-capped flex column; its cards
  (`overflow-hidden`) shrank to fit and cut off their own bottoms ("Back to the Desk", the
  Ask-for-a-change box). The column's children are `shrink-0` now, so the column scrolls
  instead of the cards clipping.
- **Only the middle scrolls:** at xl the three columns are one viewport-high workspace
  (`h-[calc(100dvh-2rem)]`, min 36rem) instead of two sticky sides beside a page-length
  report. The report column scrolls on its own; the plan and the deliver column stay put
  (each scrolls internally only if it is taller than the screen). Below xl nothing changes.

### 2026-10-02 — the summary paragraphs use the full width

The narrative block ("What to do", "The day in four sentences") was capped at
`max-w-prose`, leaving half the full-view page empty beside it. It now spans the report's
width like every other section.
