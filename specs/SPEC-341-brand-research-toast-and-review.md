# SPEC-341 — Brand research: a live toast, and Brand Brain → Review

**Status:** implemented 2026-10-06 · **Repo:** frontend · **Backend:** SPEC-347
(`SPEC-347-brand-researcher.md`) · **Builds on:** SPEC-263/267/274 (Brand Brain v2), the
competitor run toast (`features/brand-brain/competitor-run-*`), SPEC-232 (shells)

## Why

Owner (2026-10-06): when a store connects, its Brand Brain researches itself. While it works, a
toast in the top-right corner says exactly what is going on — which step, what it found, how far
along (%) — and stays there across pages and reloads. When it finishes, the toast offers the
review; clicking it opens **Brand Brain → Review**, a sub-tab with breadcrumbs, where the owner
approves everything at once or item by item. The simplest possible experience.

## The toast — `features/brand-brain/brand-research-provider.tsx` + `brand-research-toast.tsx`

- Mounted once in `app/(app)/layout.tsx` (provider around `CompetitorRunProvider`, toast beside
  the others), portalled into `#media-toast-host` like every toast (no own `fixed` box).
- **Restores** after a reload from `GET /brand-brain/research/active`; follows a running run by
  SSE (`/research/runs/{id}/events`), a finished one by its row.
- **Running:** title "Researching your brand", the % and a bar, the six steps (done ✓, running ●,
  waiting ○, skipped/failed with their one-line reason), the current step's detail ("Reading
  about-us, faq, shipping"), elapsed time, and "Runs in the background — you can leave this page."
  No close button while running.
- **Done:** "Your brand is ready to review", what was found ("18 facts · 4 customer types · 6 voice
  rules · 3 competitors"), and a primary **Review →** linking to `/spotlight/brand-brain/review`;
  clicking it, or ×, marks the run seen (`POST /research/runs/{id}/seen`) so it does not return.
- **Failed:** the reason and **Try again** (`POST /research`).
- While a research run follows its own competitor Find, the competitor toast for that same run is
  not shown (one toast, one story).
- Pure half: `lib/brand-research.ts` — adapters, `researchToastView(run)` (title, %, step lines,
  found summary), `foundSummary`, `reviewCounts`, `groupReview`.

## Brand Brain → Review — `features/brand-brain/research-review-view.tsx`

- A new Brand Brain sub-tab **Review**, second after Coverage (`BRAND_BRAIN_SECTIONS`), route
  `/spotlight/brand-brain/review`, with a breadcrumb **Spotlight › Brand Brain › Review** above the
  content.
- **Header:** "What we found about your brand" · where it came from (the run's date and trigger) ·
  **Approve all (N)** · **Research again**. While a run is going, a slim banner with its % instead.
- **Groups**, each a card with a count: *About your store* (identity, product, policy, market
  facts), *Your customers* (personas), *How you sound* (voice facts and rules), *Words* (use / never
  use), *Your look* (style), *Competitors*. Each row shows the item, **where it came from** (the
  fact's locator, e.g. "Page: About us", or the source), and its own actions: **Approve**,
  **Edit** (facts: inline value edit then approve), **Remove**. A conflict shows the approved value
  it would replace.
- **Empty state:** "Nothing waiting for review" with **Research my brand** (and, when a run has
  finished, when it ran and what was approved).
- Data: `brandBrainQueries.researchReview()` (`GET /brand-brain/research/review`); writes through
  `services/brand-research-actions.ts` and the existing Brand Brain actions; every write refreshes
  `["brand-brain"]`.
- The Knowledge Base shows the research source with the kind label **Research**.

## Docs (root Rule 11)

`lib/docs/content/spotlight.ts`: the Brand Brain tab count (now nine), a **Brand Brain — Review**
section, and the Coverage section's mention of automatic research; `updated` bumped.

## Acceptance criteria

1. After a reload during a run the toast comes back on the same step and %; it ends on "ready to
   review"; Review → opens the tab and the toast does not return.
2. Review lists exactly what the backend's review returns, grouped; Approve all empties it; each
   row's Approve / Edit / Remove works; an empty review says so.
3. The Brand Brain sub-tab bar shows Review second; old links still resolve.
4. `npm test`, `npx tsc --noEmit`, lint on touched files, `npm run build` green.

## Manual verification checklist

- Connect a development store → the toast appears in the top-right and walks the six steps.
- Navigate and reload mid-run → it stays, same step.
- Click Review → → Brand Brain › Review with everything grouped; Approve all → empty state.

## Verification (2026-10-06)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | The toast survives a reload on the same step and %; ends on ready to review; Review → opens the tab and does not return | done | Real build (`next start`) against a backend on a **throwaway** PostgreSQL, logged in with Playwright (installed Chrome): a running run, after navigating to `/dashboard` and reloading — toast present, `data-brand-research-toast="running"`, "Step 3 of 6 · 34%", current step and detail; a finished, unseen run — "Your brand is ready to review", six ticks, the found summary and **Review →**. Close/Review call `POST …/seen` (`active` then returns null — backend test). |
| 2 | Review lists what the backend returns, grouped; Approve all empties it; per-row actions; empty state | done | Screenshot of `/spotlight/brand-brain/review` after a real research run (fixed agent answers): breadcrumb Spotlight › Brand Brain › Review, **Approve all (17)**, Research again, six groups with counts, each row with its source ("From your About us page", "From your catalogue") and Approve / Edit / Remove. Approve-all and every per-item route are covered by backend tests; `tests/brand-research.test.ts` (grouping, sources, toast views). |
| 3 | Review is second in the sub-tab bar; old links resolve | done | `tests/brand-brain.test.ts` (nine sections in order, label, href), `tests/style-guide.test.ts`; legacy redirects unchanged |
| 4 | test / tsc / lint / build | done | `npm test` **207 files, 2,307 passed**; `npx tsc --noEmit` clean; ESLint clean on every touched file; `npm run build` compiled successfully |

Also: the Knowledge Base shows a research source as **AUTO**, "Read from your store"; the competitor toast stays hidden for the Find a research run follows (`hidesCompetitorRun`); labels are shown capitalised (`displayLabel`). In-app docs: `lib/docs/content/spotlight.ts` — nine sub-tabs, automatic research, a **Brand Brain — Review** section; `updated` 2026-10-06.
