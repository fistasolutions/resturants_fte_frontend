# SPEC-281 — Brand Brain: six tabs (Measured folds into Facts, History into Coverage)

**Status:** implemented 2026-09-21 · **Owner decision (2026-09-21):** "I don't want any
useless thing here — if you think so, fold it." Extends SPEC-263 (Brand Brain v2) and
SPEC-274 (Knowledge Base + Facts v2). Frontend only — the backend reads are unchanged.

## Why
Measured was Facts with a different source: the Facts read already carries every
`measured` fact and already has a **Measured** filter with its count. History was an
audit log nobody opens on purpose. Two tabs that made the brain look bigger than it is.

## What changes
- `BRAND_BRAIN_SECTIONS` becomes six: coverage · files · facts · voice · guardrails ·
  personas. `/spotlight/brand-brain/measured` redirects to `/facts?filter=measured`;
  `/history` redirects to `/coverage` (old links and bookmarks keep working).
- **Facts** reads `?filter=` on first paint (any `FactFilter`), so the redirect lands on
  the measured facts with the filter selected; the Measured filter's description says
  they are computed from the synced store and read-only (already the row behaviour).
- **Coverage** gains a **Recent changes** panel under the two grids: the last eight
  history events (who, when, what), with "Show all" expanding to the full read — the
  same rows `HistoryView` draws on the detail pages. The coverage page prefetches the
  history read alongside coverage.
- `measured-view.tsx` is removed; `history-view.tsx` stays (the detail pages and the
  panel use it, with a `limit` + `onShowAll` pair).
- Docs: the Measured and History sections go; Facts' details name the Measured filter
  as where measured facts live; Coverage's details name Recent changes. The two screen
  keys leave the registry.

## Files
`lib/brand-brain.ts`, `types/brand-brain.ts`, `app/(app)/spotlight/brand-brain/[section]/page.tsx`,
`features/brand-brain/brand-brain-section.tsx`, `coverage-view.tsx`, `history-view.tsx`,
`facts-view.tsx`, `measured-view.tsx` (deleted), `tests/brand-brain.test.ts`,
`lib/docs/content/spotlight.ts`, `../tools/build_docs_screens.py`.

## Acceptance
1. The bar shows six tabs; `/measured` and `/history` redirect as above (live check).
2. Facts opens on the Measured filter from the redirect; Coverage shows Recent changes.
3. tsc · lint · `npm test` · `npm run build` green; doc coverage test green.

## Verification (2026-09-21, live app)
- Bar: Coverage · Knowledge Base · Facts · Voice · Guardrails · Personas — six.
- `/spotlight/brand-brain/measured` → `/facts?filter=measured` with the **Measured 8**
  filter pressed; `/history` → `/coverage`.
- Coverage shows **Recent changes** (8 rows, "Show all 50 changes").
- Gates: tsc clean · lint 0 errors · `npm test` 156 files / 1,799 passed · build exit 0;
  docs coverage test green, two screen keys retired.
- Acceptance 1–3: **done**.
