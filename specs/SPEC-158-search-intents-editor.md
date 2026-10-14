# SPEC-158 — Brand Brain "Search intents" editor (frontend)

**Status:** done
**Repo:** `ecommerce-fte-frontend`
**Consumes:** backend SPEC-156 (`GET /brand-brain` → `intent_templates`; `POST`/`PATCH`/
`DELETE /brand-brain/intent-templates`).
**Governs:** an **additive** editor section in the Brand Brain tab. No other section
changes.

## Problem

Backend SPEC-156 moved the query-bank intent templates out of Python into per-store
Brand Brain data. The merchant now needs a UI to view/add/edit/remove them — so a search
intent is a merchant action, not a code deploy.

## Design

- **Data seam:** `intent_templates` rides in the existing `GET /brand-brain` payload
  (adapter `adaptBrandBrain` → `BrandBrainData.intentTemplates: IntentTemplate[]`).
  Mutations go through `/api/proxy` client actions in `services/spotlight-actions.ts`
  (`createIntentTemplate` / `updateIntentTemplate` / `deleteIntentTemplate`), mirroring
  persona CRUD.
- **UI:** a new **"Search intents"** `SectionCard` in `BrandBrainTab`, rendering
  `IntentTemplatesEditor` — a client component:
  - a row per template: phrasing, intent badge, persona, a "Default" chip for seeded
    rows, and edit / delete icon buttons;
  - inline edit (template input + intent select + persona select) and an "Add search
    intent" form;
  - persona select lists the store's real Brand Brain personas (a stale stored persona
    stays selectable so an edit can't silently drop it);
  - after any mutation, `router.refresh()` (the tab's `reconcile`) re-reads the brain.
- **Pure logic** (`lib/spotlight.ts`, unit-tested): `INTENT_TEMPLATE_INTENTS` (the four
  backend intents, in order) and `intentTemplateHasPlaceholder` — the editor gates
  Save/Add on the `{category}` placeholder and shows an inline hint when it's missing,
  so a bad template can't be submitted.

## Design-system / Rule-9 compliance

- Semantic tokens only; no hardcoded colors; brand red never used for status.
- **No entrance animations** — the section renders in place; the only motion is button
  hover and the busy states on Save/Add/Delete (in response to a click).
- Loading/disabled (busy buttons), empty (defaults are always seeded, so the list is
  never empty), and error (inline per-row + per-form `role="alert"`) states handled.
  Responsive: the edit/add controls stack on narrow screens.

## Tests (Vitest — pure logic + adapter)

`tests/intent-templates.test.ts` (7): `intentTemplateHasPlaceholder`,
`INTENT_TEMPLATE_INTENTS` order, `adaptIntentTemplate`, and `adaptBrandBrain` mapping
`intent_templates` (present → mapped; absent → `[]`).

## Verification

- `npx tsc --noEmit` — **done** (clean).
- `npm run lint` (touched) — **done** (clean).
- `npm test` — **done** (75 files, 691 tests green, incl. the 7 new).
- `npm run build` — **done** (compiled successfully).

## Manual verification checklist (no component runner yet)

1. Brand Brain tab shows a "Search intents" card seeded with the 11 defaults (each a
   "Default" chip).
2. Add a template with `{category}` → appears; without `{category}` → Add disabled +
   hint.
3. Edit a default → it flips to a plain (manual) row; delete removes it.
4. A refresh of the query bank reflects the change (new intent → new rows; removed →
   pruned). Both light and dark themes clean.

## Patches
_(none yet)_
