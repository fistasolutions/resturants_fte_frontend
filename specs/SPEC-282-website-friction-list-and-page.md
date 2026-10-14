# SPEC-282 — Website friction: search, pages, an opening row, and one page's own screen

**Date:** 2026-09-21 · **Repo:** frontend · **Status:** implemented
Backend: SPEC-278. Builds on SPEC-214 (the Website tab).

## Why

The owner, on the first day Clarity data landed: "add proper pagination and filter
to this page; the link must be a proper link into Clarity, not clarity.microsoft.com;
not '1 script issue' — show the issues; a chevron that opens smoothly and shows what
issue and which; and the pattern we have — a sub-page with breadcrumbs."

## Behaviour

- **Search, chips, pages.** The list gets the platform's own table controls
  (SPEC-258): a search box over title and path, severity chips (Severe · Notable ·
  Minor with counts), a matches/total line, and pages of 10 with the pager — held in
  the component, no request. The order stays revenue-first (SPEC-214's whole point).
- **A row opens.** Each row has a chevron; clicking it (or the row) opens a panel
  under it — CSS `grid-template-rows` 0fr → 1fr, 200 ms — listing every issue Clarity
  recorded on that page in the window, one line each with its count in proper
  English ("1 script error", "3 dead clicks", "702 quick-backs"), the sessions and
  scroll depth, and **Watch in Clarity** per issue. Nothing about *which* script
  errored is shown — Clarity's export does not say; the recordings do, and that is
  where the link goes.
- **Real Clarity links.** Every link is the store's own project with the page's
  Visited‑URL filter and, where Clarity has one, the issue filter (backend SPEC-278's
  measured parameters). Without a project id there is no link — never a link to the
  wrong place.
- **A page of its own.** The title opens `/traffic/website/[handle]` — passed bare by
  the Traffic shell, with the site's breadcrumb (Store Traffic › Website › the
  product): the page header, four tiles (sessions · friction events · per 100
  sessions · revenue 90d), the issues panel with its links, a 30‑day chart of friction
  events and sessions, the day‑by‑day rows, and the storefront paths Clarity saw.
- Plurals everywhere: `pluralise(n, "script error")`.

## Implementation

- `types/clarity.ts` — `ClarityLinks`, page gains `excessiveScroll`, `avgScrollDepth`,
  `avgActiveSeconds`, `clarity`; `ClarityFrictionDay`, `ClarityFrictionPath`,
  `ClarityFrictionDetail`. `lib/adapters.ts` — `adaptClarityFrictionDetail`.
- `lib/queries/clarity.ts` — `frictionPage(handle)`; `services/clarity.ts` face.
- `lib/clarity-friction.ts` (pure, tested) — `issueLines`, `pluralise`,
  `FRICTION_TABLE`, `frictionRate`.
- `features/traffic/website-friction-view.tsx` — toolbar, rows with the opening
  panel, pager. `features/traffic/website-page-view.tsx` + `website-friction-chart.tsx`
  — the sub‑page. `app/(app)/traffic/website/[handle]/{page,loading}.tsx`.
- `lib/docs/content/traffic.ts` — Website section; new "One page's friction" section.

## Acceptance criteria

- [x] Search / severity chips / pager on the list; revenue order kept.
- [x] Chevron opens the issue panel smoothly; counts read in proper English; per‑issue Watch links go to the store's Clarity project with the page filter.
- [x] `/traffic/website/[handle]` with breadcrumb, tiles, issues, chart, days, paths; unknown handle → the honest empty state.
- [x] `npm test`, `tsc`, lint, build green; docs updated.
