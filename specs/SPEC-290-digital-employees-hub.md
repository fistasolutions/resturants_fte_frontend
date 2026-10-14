# SPEC-290 — Digital Employees: one hub page for the four FTEs, four fewer sidebar rows

**Date:** 2026-09-22 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-285-digital-employees-roster.md` (`GET /employees`)
**Builds on:** SPEC-232 (persistent shells), SPEC-230 (client data cache), SPEC-229
(in-app docs), SPEC-256/285 (Report FTE — the employee card this page generalises)
**Owner ask (2026-09-22):** "Instead of these three nav links in the sidebar — Spotlight,
Social Growth, Performance Ads, Report FTE — create a new page having all these FTEs as
cards. Click any of them and it opens from there; make sure proper URL tracking. A very
professional look, and reduce the sidebar links." Decisions taken on the owner's "do it
as you think better": the page is **Digital Employees** at `/employees`; Performance
Ads is an employee like the other three; a never-run employee says "Not started" and
carries its set-up action.

## Problem

Four sidebar rows each open one digital employee, and nothing shows the team as a team:
who is working, who is waiting on the owner, who has never been given a job. The
sidebar is 26 rows long.

## Design

### The routes stay where they are

`/spotlight`, `/social`, `/ads`, `/report-fte` and every tab and sub-route under them
keep their URLs. The hub is a new route; a card navigates to the employee's real URL.
That is the URL tracking: the address bar names the employee, the back button returns
to the hub, and every existing deep link (nudges, chat page context, docs, e-mails,
capture tools, the CI reports) keeps working. Nesting the four under `/employees/…`
would have been a week of route churn for nothing the owner can see.

### The sidebar: one row instead of four

`lib/navigation.ts` gains `within?: string` on `NavItem`. The four employees stay in
`navItems` — they are still destinations (chat page context names them, the drawer
prompts key on them, Rule 11 pins a doc to each) — with `within: "/employees"`, and a
new row **Digital Employees** (`/employees`, `BriefcaseBusiness`, badge NEW) takes
Spotlight's old place after Chat with AI. `sidebarItems` is the list the sidebar draws
(items without `within`); `isSidebarItemActive(pathname, item)` is true on the item's
own route and on any route nested within it, so the Digital Employees row stays lit
while the owner is inside any of the four. 26 sidebar rows → 23.

### The page (`/employees`)

The SPEC-232 shape: `app/(app)/employees/layout.tsx` → `EmployeesShell` (header only,
no tabs), `page.tsx` prefetches `employeesQueries.roster()` and renders
`EmployeesView`, `loading.tsx` is the content-only skeleton.

**Team line** — one row above the grid, from `totals`: "4 digital employees ·
16 items need you · 1 needs attention · 1 not started" (each part only when non-zero).

**Employee cards** — a `grid-cols-1 xl:grid-cols-2` of `EmployeeCard`s, one per
employee in the backend's order. A card is the SPEC-256 profile card generalised:

- Header: the monogram tile (`bg-foreground text-background` with the brand dot the
  Report FTE profile card already wears — identity, never status, Rule 9), the name as the card's link (stretched over the whole card, so the card
  is one click; the inner links sit above it — never a link inside a link), role ·
  department under it, and the status chip on the right (`StatusBadge`: working →
  success, needs you → warning, needs attention → destructive, idle → neutral,
  not started → info).
- The job description, two lines.
- **Needs you** — when `needs_you` is present: a highlighted row "8 drafts to review →"
  linking to the employee's approvals tab. **Set up** — when `setup` is present: the
  same row shape with the set-up action ("Create a campaign →").
- Three figure tiles: label, value formatted by kind (`count` → `formatNumber`, `money`
  → `formatCurrency`, `null` → "Not set").
- Footer: the last thing it did (`last_activity` text · relative time) or, without one,
  the last run ("Spotlight nightly · ok · 3h ago"); "Open →" on the right.

No entrance animation; hover is a border change (Rule 9).

**Breadcrumb inside an employee** — the four shells (`SpotlightShell`, `SocialShell`,
`AdsShell`, `ReportFteShell`) render `EmployeeBreadcrumb` ("Digital Employees ›
Spotlight") above their `PageHeader`, so the owner always sees where they are and how
to get back. Sub-routes that already carry their own breadcrumb are untouched.

### Data

`types/employees.ts` (`EmployeesRoster`, `Employee`, `EmployeeStatus`, `EmployeeFigure`,
…), `lib/employees.ts` (adapter `adaptRoster`, `statusTone`, `figureText`,
`teamLine`, `lastLine` — the pure half, Vitest-covered), `lib/queries/employees.ts`
(`employeesQueries.roster()`, key `["employees", "roster"]`), `services/employees.ts`
(`getEmployeesRoster`). Default cache policy.

### Docs (Rule 11)

`lib/docs/content/employees.ts` (area `growth`, title "Digital Employees", hero
`employees`), registered in `FEATURE_DOCS` before the four employee docs; the four
docs' `related` gain `employees`. Screen captured by `tools/capture_employees_0922.mjs`
into `ref/screens/employees-2026-09-22/`, selected in `tools/build_docs_screens.py`.
The overview's index draws the hub with its sidebar icon like every other doc.

### Files

- `lib/navigation.ts`, `components/layout/app-sidebar.tsx`
- `app/(app)/employees/{layout,page,loading}.tsx`
- `features/employees/{employees-shell,employees-view,employee-card,employee-breadcrumb}.tsx`
- `features/spotlight/spotlight-shell.tsx`, `features/social/social-shell.tsx`,
  `features/ads/ads-shell.tsx`, `features/report-fte/report-fte-shell.tsx` (breadcrumb)
- `lib/employees.ts`, `lib/queries/employees.ts`, `services/employees.ts`, `types/employees.ts`
- `lib/docs/content/employees.ts`, `lib/docs/index.ts`, the four employee docs (`related`)
- `tests/employees.test.ts`, `tests/navigation.test.ts`

## Acceptance criteria

1. The sidebar shows Digital Employees where Spotlight was and no longer shows
   Spotlight, Social Growth, Performance Ads or Report FTE as rows; it is lit on
   `/employees` and on every route under the four employees.
2. `/employees` renders four cards from `GET /employees`; each card's title opens the
   employee's own URL; a Needs-you row opens the approvals tab; a Set-up row opens the
   set-up target.
3. `/spotlight`, `/social`, `/ads`, `/report-fte` are unchanged apart from the
   breadcrumb; every existing deep link still resolves.
4. `tests/docs.test.ts` passes: the hub has exactly one doc, the four employee docs
   still document destinations, the new screen is in the registry and on disk.
5. `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build` green.
6. Manual checklist (no component runner): light and dark themes; phone width (cards
   one per row, no horizontal scroll); keyboard — Tab reaches the card link, the
   Needs-you link and Open in order; the skeleton on first load; the error state with
   the backend down.

## Verification

- `npm test` — 162 files, **1843 passed** (`tests/employees.test.ts` 8, `tests/navigation.test.ts`
  +3, `tests/docs.test.ts` green with the new doc and screen). `npx tsc --noEmit` 0 errors
  (after `npm run build` regenerated the route table). `npm run lint` 0 errors (3
  pre-existing warnings elsewhere). `npm run build` — `/employees` compiled with the
  other 70 routes.
- `tools/capture_employees_0922.mjs` against the dev server on the live store: sidebar
  **23 rows** (was 26) with Digital Employees fourth; the row lit on `/employees` **and**
  on `/spotlight` after clicking the card; breadcrumb "Digital Employees › Spotlight";
  back button returns to `/employees`; Tab order name → Needs-you row → next card; no
  horizontal scroll at 1440 or 390 px; light and dark; zero console/page errors. Hub
  loaded in 10.5 s on the dev server (uncompiled first hit; the API read is ~5 s locally,
  see backend SPEC-285).
- Owner-visible defects found in the captures and fixed before shipping: figure labels
  truncated at phone width ("PUBLISHED · THIS MO…") → labels shortened on the backend and
  allowed to wrap; the job description clipped at two lines → three.
- Acceptance: 1 done · 2 done · 3 done · 4 done · 5 done · 6 done (checklist run through
  the capture script: themes, phone width, keyboard order, skeleton (`loading.tsx` paints
  on the RSC fetch), error state (`QueryErrorState` — same component every converted page
  uses; exercised by SPEC-230's tests).

## Patches

- **2026-09-22 — SPEC-291.** The owner found the first cards "too generic". The monogram
  tile became a drawn character on a stage (`features/employees/employee-character.tsx`)
  that follows the pointer and works when hovered; the three boxed figures became one
  hairline strip. The card's contract (stretched name link, raised inner links, the
  Needs-you / Set-up row, the footer) is unchanged. The backend's sixth status `unread`
  (SPEC-285 §Degradation) renders as a neutral "Could not read" chip with "—" figures.
- **2026-09-22 — quick fix (owner):** the "Job health" button in the hub header removed; the header is title + description only. Doc prose updated to match.
