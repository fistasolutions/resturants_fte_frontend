# SPEC-262 — Watchlist: "tell me when…"

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-262-watchlist.md` (`/watches`, `sources.watch`, the fired watch on `/nudge`).
Ideas document item 10. Mockup: `ref/mockups/watchlist.html`.

## Behaviour

1. **Ask for a watch in chat or the panel** — "Tell me when returns on Katie Dress pass
   20%". The analyst calls `set_watch`; the answer card ends with a **Watching** block
   (eye icon; rule · checked every sync · who is told · today's reading) and a link to
   Settings → Watching. `/watch <rule>` in the shortcut menu expands to "Tell me when {rule}".

2. **When it trips — the nudge, on any page.** The fired watch arrives through the same
   `GET /nudge` the page nudge uses, so `nudgeRouteFor` now asks on every route (the
   backend answers the fired watch first, then the page rule, then null). The card is the
   SPEC-246 card with `page` "Watchlist"; **Explain** sends the note to the analyst,
   **Open** (when `href`) goes to the page behind the figure, **Not now** dismisses by
   id (`watch:<id>:<fired_at>` — a second firing is a new id).

3. **Settings → Watching** (`/settings/watching`, fifth tab; badge = fired count):
   the table — Rule (+ period line) · Now (value, with a meter against the line) · Tell
   (Nudge / role chips) · Status (Fired <when> / Quiet · Nd / Paused) — a **New watch**
   dialog (metric select → argument fields appear: product name, period; direction;
   threshold in the unit; Nudge switch; Email role select with "not set in Settings"
   warnings from `recipients`), row menu (Edit, Pause/Resume, Delete with confirm),
   **Check now** (`POST /watches/check`) with the result inline. Loading / empty / error
   states; the empty state shows three example rules.

## Implementation

- `types/watch.ts`, `lib/queries/watches.ts` (`watchPaths.list`, `watchQueries.list()`),
  `services/watches.ts` (create / update / remove / check).
- `lib/watchlist.ts` — pure: `formatWatchValue`, `meter` (0–1 fill + line position),
  `statusLabel`, `tellLabels`, `validateWatchForm`, `metricNeedsProduct`, `EXAMPLES`.
- `features/settings/watching-view.tsx`, `watch-dialog.tsx`, `watch-row-menu.tsx`;
  `settings-tabs.tsx` + `settings-shell.tsx` gain the tab; `app/(app)/settings/watching/page.tsx`.
- `features/chat/answer-card.tsx` — the Watching block from `sources.watch`.
- `lib/nudge.ts` `nudgeRouteFor` on every route; `chat-nudge.tsx` Open button on `href`.
- `lib/slash-commands.ts` `/watch`.
- Docs: `settings.ts` "Watching" section, `chat.ts` "Tell me when" section; captures `settings-watching`, `chat-watch`.

## Acceptance criteria

- [x] Settings → Watching lists real watches with Now / Tell / Status; New watch creates one against the live API; Pause, Edit, Delete work; Check now runs and reports.
- [x] A crossed watch shows the card on a page with no rule of its own (e.g. /tax-reports); Explain opens the panel with the question; Not now hides it.
- [x] "Tell me when …" in chat creates the watch and the card shows the Watching block.
- [x] `npm test`, `tsc`, lint, `npm run build` green; docs updated.
