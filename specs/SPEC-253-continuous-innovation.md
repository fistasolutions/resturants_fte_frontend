# SPEC-253 — /ci · Continuous Innovation: every build report, in the app

**Date:** 2026-09-16 · **Repo:** frontend (content pipeline at the monorepo root) · **Status:** implemented
Reference: `ref/ci-mockup.html` — the approved clickable mockup (owner: "just wow, do it end to end").
Depends on: SPEC-232 (persistent shells), SPEC-229 (in-app docs — the data-module pattern
this copies), root Rule 11 (a new sidebar destination ships with its doc).

## Problem

The build reports — one engagement report, four weekly, seven daily — live as PDFs in
`Reports/`. The CEO wants them in the product: open `/ci`, see every report since day one
as cards (the engagement report first, then day by day, newest on top), click one and
read it in three columns — the dates on the left, the report in the middle, its table of
contents on the right — each report opening on its hook and its value memo.

## What this builds

1. **`tools/build_ci_content.py`** (monorepo root, run from the backend repo with
   `uv run python ../tools/build_ci_content.py`, like the docs pipeline). It imports every
   report generator (`build_daily_report_*.py`, `build_weekly_report*.py`,
   `build_engagement_report.py`) as a module — their `SECTIONS` / `DAYS` / `TIERS` /
   `NEXT_ITEMS` / `CAUTIONS` / phase lists are module-level data — and writes:
   - `ecommerce-fte-frontend/lib/ci/content.ts` — **generated, never hand-edited** —
     `CI_REPORTS: CiReport[]` newest first: `id`, `kind` (engagement · weekly · daily),
     `period`, `sortDate`, `hook` (curated in the tool — the headline the card leads
     with), `memo` (the report's own cover lede, entities resolved), `effort`, `views`,
     `sections[]` (n · title · sub · ask · status · mins · inside[] · built · why · value ·
     shots[]), `tiers[]`, `next[]`, `cautions[]`, `days[]`.
   - `ecommerce-fte-frontend/public/ci/<report>/<shot>.webp` — every screenshot the
     report used, downscaled to 1400 px, with its size recorded on the shot.
   Text keeps the generators' `<b>`, `<i>`, `<code>` inline marks only; every other
   tag is stripped and every entity resolved, so the page renders the marks with
   elements — no `innerHTML`.
2. **`/ci` — the feed.** Persistent shell (`features/ci/ci-shell.tsx`, header
   "Continuous Innovation"); a hero card for the engagement report with its four
   numbers, then month groups of cards — period, kind pill, hook, memo, effort · screens ·
   areas. Each card is a link to `/ci/<id>`.
3. **`/ci/[id]` — the reader.** Three columns (stack on a phone): the date rail (every
   report grouped by month, the current one selected), the report (eyebrow, hook, memo,
   the meta strip, then each section as the PDF prints it — the ask, the three boxes,
   what is inside, the screenshots with route and caption; then before/after, where this
   leaves us, the four rules), and the contents (one link per section, the visible one
   highlighted by an intersection observer).
4. **`lib/ci.ts`** — pure: `reportsByMonth`, `richText` tokenizer (`<b>`/`<i>`/`<code>`
   → tokens), `hm`, `tocFor`. Vitest.
5. **Sidebar** — "Continuous Innovation" under Platform with the Glisp mark; **doc**
   `lib/docs/content/ci.ts`, registered (the coverage test requires it).

## Not changed

The PDFs and their generators; `Reports/`. A new report = run its generator as before,
then `build_ci_content.py` (one curated `hook` line per report in the tool).

## Acceptance criteria

1. `/ci` lists all 12 reports newest first with the engagement report as the hero;
   `/ci/d0915` opens the Sep 15 report with 9 sections, 33 screenshots, the TOC and the rail.
2. Every string renders its bold/italic/code marks without `dangerouslySetInnerHTML`.
3. `npm test`, `tsc`, ESLint, `npm run build` green; `tests/docs.test.ts` passes with the
   new nav item.

## Manual verification (no jsdom runner — root Rule 4)

Done 2026-09-16 on the running app (Playwright, `ref/screens/ci-2026-09-16/`, `tools/capture_ci.mjs`):

- [x] Feed: 4 counters (since Aug 13, 13 reports, 244 screens), the engagement hero
      with its numbers, September and August groups newest first; 390 px stacks to one
      column (`07-ci-phone`).
- [x] Reader `/ci/d0915`: rail with the current report selected, 9 sections with ask,
      the three boxes, what is inside (bold/code marks as elements), route pills and
      screenshots; TOC with the closing pages. `/ci/engagement` (44 areas) and
      `/ci/w0822` (21 printed pages) render.
- [x] Pipeline: 13 reports, 244 images, 14.9 MB in `public/ci/`; no stray tags, no
      entities left (`tests/ci.test.ts` pins both).
- [x] `npm test` 1621 passed (136 files), `tsc` clean, ESLint 0 errors, `npm run build`
      green with `/ci` and `/ci/[id]`; the docs coverage test passes with the new nav item.

## Patches

- **2026-09-16 — filters, pagination, value-first cards, custom scrollbars** (owner, on
  the first live look). The feed gained a filter bar — kind (All · Engagement · Weekly ·
  Daily), month, and a search over hook, memo and area titles — with the result count,
  and pagination of six reports a page; all of it in the URL (`?kind=&month=&q=&page=`)
  so a filtered view can be shared and survives a reload. The engagement hero shows only
  on the unfiltered first page. Cards were redesigned to lead with value: kind and
  period, the hook, a three-line memo, then **What it delivered** — the first three
  areas by name with "+N more" — and a foot of effort · screens · areas with a "Read
  report" affordance. The reader's date rail and contents column use the app's
  `scrollbar-subtle` (thin token-coloured thumb) instead of the browser default. Pure
  `filterReports` / `paginate` / `monthOptions` / `areasOf` in `lib/ci.ts`, tested.
- **2026-09-16 — the business view.** Owner: "these are read by the CEO — nothing
  technical." The pipeline now classifies every "what is inside" line, every section
  sub line and every closing-page row: an endpoint, a spec or migration number, a file
  path, a snake_case identifier, test/build/tooling talk, a timing, a QA "verified live"
  sentence is **technical**. A line keeps its business sentences (`text`, identifiers
  scrubbed — `GET /results/managers regroups…` → `Regroups…`) and its whole text
  (`full`); a line with nothing business-readable left is hidden. The reader shows the
  business view by default with a **Technical detail** switch (per browser,
  `localStorage`, read through `useSyncExternalStore` so the server renders the
  business view) and says how many lines it is hiding. One memo (Sep 10) was rewritten
  for the owner in the tool (`MEMO_OVERRIDES`); the other twelve read business already.
  Verified live: the Sep 15 business view contains no `SPEC-`, `GET /` or "migration";
  the switch shows them and survives a reload. 26 lines hidden across the 13 reports.


## Patches

### 2026-09-21 — the Sep 21 daily on the feed
`tools/build_daily_report_0921.py` (copied from `_0918`; reads captures from any folder
by `dir/name`; the "Pushed to GitHub" page became "What changed on disk today" from
`git status` — 286 files across the three repositories) renders
`Reports/Daily-Build-Report-2026-09-21.pdf` (38 pages, 36 screens, 10 areas).
Registered as `d0921` in `tools/build_ci_content.py` GENERATED/HOOKS and re-run —
18 reports, 432 images; `tests/ci.test.ts` pins 18 and `d0921` as the newest card
with 10 sections. Route placeholders in captions use `…`, never `<handle>`: the
bundle test rejects any tag but `b`/`i`/`code`/`id`. Verified on the production
build against a spare backend: the card is second on the feed, `/ci/d0921` renders
with zero page errors.

### 2026-09-18 — the engagement hero's effort figure
The four hero numbers are the engagement report's own; the effort tile still said
"432 h" from the Sep 16 edition after the Sep 18 edition (ten continuation days) put
the total at 505 h. Updated with the report; the comment now names the edition. The
feed carries the Sep 18 daily, the Sep 14–18 weekly and the Sep 18 engagement edition
(`tools/build_ci_content.py` GENERATED/HOOKS; `tests/ci.test.ts` pins 17 reports).
