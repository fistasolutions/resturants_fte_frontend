# SPEC-256 — Report FTE: the user interface, first

**Date:** 2026-09-16 · **Repo:** frontend · **Status:** implemented (UI on typed mock
data; backend counterpart not yet specified — see "The seam" below)
**Source:** `ref/Report_FTE_Mockup.html` (the clickable concept the owner approved
on 2026-09-16) and `ref/report-fte-mockup.html`
**Builds on:** `SPEC-230` (client data cache), `SPEC-232` (persistent shells),
`SPEC-227` (error boundaries), `SPEC-229-in-app-docs.md` (Rule 11), `SPEC-248`
(Glisp identity — the AI marker), `SPEC-235` (the Ask Glisp panel)
**Owner decision:** "First and foremost generate the UI for the FTE — just the user
interface first." This spec is that UI. Every figure it shows is typed mock data
behind the service seam (root Rule 6's one sanctioned exception); no number is
computed in the browser.

## Problem

Every page in the platform is a fixed report — figures the engine computes, laid out
in a shape an engineer chose — and the FISTA backlog is mostly a hundred more of
them. The Report FTE is one digital employee that builds any report from the same
figures, exposed as MCP tools, on the owner's schedule: a new report becomes a
template, not a page. Before the backend (an MCP server over the 65 analyst tools,
templates as data, a plan → compute → compose → approve → deliver pipeline) is
built, the owner wants to hold the surface in his hands: the desk, the composer,
the templates, the tool catalogue, the delivery log and the employee's profile —
with the loading, empty and error states a real page has.

## Behaviour

1. **A new sidebar destination — `Report FTE` at `/report-fte`** (Lucide
   `NotebookPen`, badge `NEW`), placed directly after `Daily Reports` so the two
   report entries sit together. It has the persistent shell every route has
   (`app/(app)/report-fte/layout.tsx` → `features/report-fte/report-fte-shell.tsx`
   — `<main>` + `PageHeader` + the tab bar) and seven content-only tab pages, each
   with its own content-only `loading.tsx` skeleton shaped like the page it stands
   in for:

   | Tab | Route | What it shows |
   | --- | --- | --- |
   | Desk | `/report-fte` | the ask box with grounded example asks, the template gallery (six), Delivered and Scheduled lists, the employee card with its four scorecard tiles |
   | Composer | `/report-fte/composer` | the plan the FTE understood (audience · period · delivery · sections, each bound to a tool), the report preview, the tool-call trace and the Deliver panel |
   | Templates | `/report-fte/templates` | all fourteen templates with cadence filters, plus "Start from a question" |
   | Template editor | `/report-fte/templates/[templateId]` | the ordered section list (expand a row for its parameters and toggles), report settings, the add-a-section picker |
   | MCP tools | `/report-fte/tools` | the tool catalogue in ten groups with Engine / Integrations / Report-tools filters and a detail panel for the selected tool |
   | Delivered & scheduled | `/report-fte/delivered` | three sub-tabs: Scheduled, Delivered, What the recipient receives |
   | Profile | `/report-fte/profile` | job description, the five-rung authority ladder, guardrails, the September scorecard, the shift |

   `lib/report-fte-tabs.ts` is the pure tab model (mirrors `lib/product-tabs.ts`);
   the editor is a sub-route that the shell still frames (it is a tab's detail, so
   the Templates tab stays active on it).

2. **The composer is a state machine the user drives.** `idle` (the plan is shown,
   the report area invites "Run the plan") → `running` (each section appears as its
   tool call completes; the trace rows fill in order; the Deliver buttons stay
   disabled) → `ready` (five of five grounded; Approve & send / Approve & schedule
   enabled) → `sent` / `scheduled` (the status line records what happened; the
   button becomes its own receipt). Editing a plan section marks it and returns the
   composer to `idle` for that section. `?ask=<text>` on the composer route carries
   the ask from the Desk; the plan's title is derived from it by
   `lib/report-fte.ts` `templateForAsk` (routing to a template is UI logic; the
   figures inside are not).

3. **Every read goes through the client cache** (SPEC-230): `lib/queries/report-fte.ts`
   defines `desk`, `composerPlan(ask)`, `templates`, `template(id)`, `tools`,
   `delivered`, `profile`; each page prefetches its definition on the server and
   the view reads it with `useApiQuery`. **The loaders resolve typed mock data from
   `lib/mock/report-fte.ts` until the backend exists** — the file says so at the
   top, `reportFtePaths` already names the routes the backend will expose
   (`/report-fte/desk`, `/report-fte/plan`, …), and the swap is one line per loader
   (`api<…>(path)` instead of the mock). Writes (run, approve, schedule, save
   template, add section) go through `features/report-fte/use-report-fte-actions.ts`,
   the one hook the views call — today it resolves against the same mock module;
   tomorrow it posts through `/api/proxy`. Nothing else in the feature knows which.

4. **Loading, empty and error states are real.** Each route's `loading.tsx` is a
   content-only skeleton with the page's own shape (tiles, a two-column layout, a
   table); the views render `QueryErrorState` on a rejected query; the Desk shows
   an honest empty state when there is nothing delivered or scheduled yet; the
   composer's "nothing has run" state is a designed panel, not a blank.

5. **Design system, verbatim** (root Rule 9): `Panel`/`PanelRow`/`StatusDot`,
   `KpiStrip` (with `explain={false}` — no analyst tool can recompute these tiles
   yet), `StatusBadge`, `Card`, `Button`, `Input`, `Select`, `Switch`, `Tabs`-style
   underline nav — tokens only, both themes, no entrance animation. The AI marker on
   AI-written sections is `GlispIcon`, never `Sparkles` (SPEC-248). The FTE's own
   identity is a token-driven initial tile (`RF`) — it is a different employee from
   Glisp and must not borrow the analyst's icon.

6. **Docs ship with it** (Rule 11): `lib/docs/content/report-fte.ts`, registered
   after `reports` in `FEATURE_DOCS`, area `command`, one section per tab, hero
   captured from the live page (`ref/screens/report-fte-2026-09-16/`, root
   `tools/capture_report_fte.mjs`), and every sentence describing what the UI does
   today — the doc says plainly that the figures are illustrative until the engine
   is connected.

## The seam (what the backend spec will replace)

| Today (this spec) | Tomorrow |
| --- | --- |
| `lib/queries/report-fte.ts` loaders return `lib/mock/report-fte.ts` data | the same loaders call `api<T>(reportFtePaths.…)` |
| `use-report-fte-actions.ts` resolves `mockRunPlan` … in-process | it posts to `/api/proxy/report-fte/…` and invalidates `["report-fte"]` |
| `types/report-fte.ts` is the contract both sides will share | unchanged — the backend implements these shapes |
| the registry is **not** in `tests/query-registries.test.ts` | it is added the day the loaders touch `api` |

## Implementation

- `lib/navigation.ts` — the nav item.
- `lib/report-fte-tabs.ts` (+ `tests/report-fte-tabs.test.ts`).
- `types/report-fte.ts`; `lib/mock/report-fte.ts`; `lib/queries/report-fte.ts`;
  `services/report-fte.ts` (the `serverApi` face, per convention).
- `lib/report-fte.ts` (+ `tests/report-fte.test.ts`) — `scorecardTiles`,
  `templateForAsk`, `composerTransition`, `filterTools`, `traceProgress`, labels.
- `app/(app)/report-fte/**` — layout, seven pages, seven `loading.tsx`.
- `features/report-fte/` — shell, tabs, one view per tab, the composer's four
  panels, the editor's section row, the tools detail, skeletons, the actions hook.
- `lib/docs/content/report-fte.ts`, `lib/docs/index.ts`, screens pipeline.

## Acceptance criteria

1. `/report-fte` and its six sub-routes render inside one persistent shell with the
   active tab underlined; the editor keeps Templates active — **done**.
2. Every route has a content-only skeleton shaped like the page — **done**.
3. Desk: the ask box, example asks fill it, "Build it" opens the composer with the
   ask; templates open the editor; delivered/scheduled lists with an empty state —
   **done**.
4. Composer: idle → running → ready → sent/scheduled, trace fills in order, plan
   sections expand, Deliver buttons gate on state — **done**.
5. Templates gallery with cadence filters; editor with expandable section rows,
   toggles, settings and add-a-section — **done**.
6. MCP tools catalogue with group filters and a detail panel — **done**.
7. Delivered & scheduled with three sub-tabs, including the recipient's email —
   **done**.
8. Profile: job description, authority ladder, guardrails, scorecard, shift —
   **done**.
9. All reads through `lib/queries/report-fte.ts` + `useApiQuery`; all mutations
   through the one actions hook; mock data only in `lib/mock/` — **done**.
10. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green; the doc
    and its capture in place — **done** (outputs in the summary).

## Manual verification checklist (no component runner — Rule 4)

- Every tab at 1440 and 400 px, light and dark: no horizontal scroll, no clipped
  column, skeleton → content with no layout shift.
- Desk → chip → Build it → Composer shows the ask; Run the plan → sections appear
  in order → Approve & send → status changes; back to Desk → Delivered lists it.
- Templates → a card → editor with that template's name; expand a row; flip a
  toggle; Add a section appends a row and bumps the count.
- Tools → filter → pick a tool → the detail panel updates.
- Keyboard: every control reachable; tab bar links; dialog confirm on delete.
