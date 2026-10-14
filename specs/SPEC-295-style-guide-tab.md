# SPEC-295 — Brand Brain → Style Guide (the eighth tab)

**Status:** done
**Date:** 2026-09-23
**Repo:** frontend
**Depends on:** backend SPEC-290 (style rows + `section`), SPEC-289 (one rulebook)

## Why

The owner can read and re-word what a picture must never do (Guardrails → image rules,
SPEC-294), but the brand's actual **look** — palette, light, composition, styling,
typography, the hero banner's crop — lives in backend prompt strings. Backend SPEC-290
turns it into `brand_rules` of kind `style`, grouped by `section`. This spec gives it its
own tab, because a style guide read next to word rules is a style guide nobody reads.

Owner decision (2026-09-23): **its own tab**, and the existing image (safety) rules move
into it.

## What ships

### 1. The tab

`BRAND_BRAIN_SECTIONS` gains `"style-guide"` after `guardrails` — eight tabs:
Coverage · Knowledge Base · Facts · Voice · Guardrails · **Style Guide** · Personas ·
Competitors. The URL segment is the key (`/spotlight/brand-brain/style-guide`), served by
the existing `[section]` route and `BrandBrainShell`.

### 2. `features/brand-brain/style-guide-view.tsx`

One card per section in the backend's reading order — **Palette · Light · Composition ·
Styling · Typography · Layout · Brand safety** — each with a one-line explanation of what
it changes, its rows, and an inline "Add a rule" row. A row shows label · detail ·
provenance, a switch, inline edit and delete, reusing the `guardrails-view.tsx`
vocabulary (`useBrandBrainRefresh`, the same `addRule`/`updateRule`/`deleteRule`
services) so there is one write path, not two.

An empty section says which built-in default is in force rather than showing nothing —
"no rows, so the built-in <section> direction applies" — because a picture is never
generated unguarded.

### 3. `lib/style-guide.ts` (pure, Vitest-covered)

- `STYLE_SECTIONS` — the seven keys, labels, blurbs, in backend order.
- `groupStyleRules(rules)` — rows by section, unknown/empty section → `safety` for an
  `image` row and `composition` for a `style` row (never dropped).
- `styleSectionSummary(rules)` — "4 on · 1 off", the card subtitle.
- `isStyleRule(rule)` — `kind === "style" || kind === "image"`.

### 4. Guardrails tab

Loses its "Image rules" card (it moves here) and links across: "Picture rules live in the
Style Guide." Word rules, claims and calendar stay.

### 5. Docs (Rule 11)

`lib/docs/content/spotlight.ts` gains the Style Guide section (title, route, summary,
details) and its `updated` is bumped; the Guardrails section's prose drops the image
rules and points at the new tab.

## Acceptance criteria

1. Eight tabs render, `style-guide` active on its URL, and `tests/docs.test.ts` stays
   green (the doc covers the new section).
2. Adding, editing, toggling and deleting a style row round-trips against the backend and
   the list reflects it without a full reload.
3. `lib/style-guide.ts` is pure and unit-tested — grouping, ordering, the fallback
   bucket, the summary.
4. The Guardrails tab no longer renders image rules and carries the pointer.
5. `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build` all green.

## Verification

Driven live on 2026-09-23 with Playwright against the production build on :3100 and a
reload-free backend on :8100 (`tools/capture_style_guide_0923.mjs`, captures in
`ref/screens/style-guide-2026-09-23/`).

- **Eight tabs, the new one sixth:** `Coverage | Knowledge Base | Facts | Voice |
  Guardrails | Style Guide | Personas | Competitors`. The tab painted in **4.6 s** cold
  (remote Railway Postgres; a revisit is served from the client cache).
- **Seven cards, the backend's order:** Palette (3 on) · Light (2) · Composition (3) ·
  Styling (2) · Type & logo (2) · Layout (3) · Brand safety (6) — the store's 21 real
  picture rules.
- **The whole write path, on the live store:** added *"Shot on film"* to Palette → the row
  rendered; switched it off → `aria-label` became `Shot on film — off`, `data-state`
  `unchecked`; deleted it → the row detached and the database has no `%film%` row left.
- **Guardrails repointed:** its "Picture rules" card now links to the Style Guide and no
  longer renders the image rules.
- **Both themes:** captured light and dark; tokens only, no hardcoded colour.
- **Gates:** `npm test` **1,871 passed (166 files)** including the 7 new
  `tests/style-guide.test.ts` cases and `tests/docs.test.ts`; `npx tsc --noEmit` clean;
  `npm run lint` 0 errors (3 pre-existing warnings); `npm run build` compiled.

### Acceptance criteria

| # | Criterion | Status |
| --- | --- | --- |
| 1 | Eight tabs render, `style-guide` active on its URL, docs test green | done |
| 2 | Add, edit, toggle, delete round-trip and the list reflects it | done |
| 3 | `lib/style-guide.ts` pure and unit-tested | done |
| 4 | Guardrails no longer renders image rules and carries the pointer | done |
| 5 | `npm test`, `tsc`, `lint`, `build` green | done |

## Patches

- **2026-09-23 — the switch answers immediately.** The first live run showed the toggle
  holding its old state for ~3 s (a write plus its refetch against the remote database).
  `StyleGuideView` keeps a `pending` map, so the row, its label and the card's "N on"
  count show what was asked for while it saves; the map clears when the list returns.
  The Guardrails tab is untouched — this stays inside the new view.
- **2026-09-23 — the add-rule form is bottom-aligned (`mt-auto`)** so two cards in a grid
  row end together instead of leaving a ragged gap under the shorter one.
- **2026-09-23 — the doc's screen.** `spotlight-brand-brain-style-guide` was added to
  `tools/build_docs_screens.py` and the pipeline re-run (138 screens); the Guardrails doc
  screen was repointed at today's capture, since its image card is gone.
