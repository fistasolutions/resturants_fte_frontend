# SPEC-294 — Image rules on the Guardrails tab

**Date:** 2026-09-22 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-288-image-guardrails-from-brand-brain.md`
**Builds on:** SPEC-263 (Brand Brain v2 — the Guardrails tab)
**Owner, 2026-09-22:** looking at `/spotlight/brand-brain/guardrails` — "I saw nothing
here", after being told the rules that scratched out a model's face were hardcoded in
the backend.

## Problem

The Guardrails tab governs the **words**: nine positioning rules, banned/required terms,
a claims policy, the religious calendar. Nothing on it governs the **pictures**, yet the
hero and every social image are generated under a brand-safety block the owner cannot
see. When one of those lines misfires — "faceless" making the image model smear a face —
there is no row to re-word.

## Change

Backend SPEC-288 makes those lines `brand_rules` rows of kind `image`. This spec puts
them on the page.

- `lib/brand-brain.ts`: `RuleKind` and `RULE_KINDS` gain `"image"`; the adapter's
  fallback stays `"claim"` (an unknown kind is a claim, not a silent image rule).
- `features/brand-brain/guardrails-view.tsx`: a fourth panel, **Image rules**, under
  Claims policy in the right-hand column — the same `SwitchRow` list, hint *"every image
  the brand generates ends with these"*, plus one line of body copy naming where they
  apply (blog headers and social creative). Each row toggles through the existing
  `updateRule`; an owner can also add one (label + detail) the way Claims rows read, so
  the panel is not read-only.
- The intro strip above the grid gains the second half of the sentence: guardrails gate
  **copy and pictures**.

Nothing else moves: the same `/brand-brain/rules` endpoints, the same optimistic
`run()` wrapper, the same cache key.

## Acceptance criteria

1. `/spotlight/brand-brain/guardrails` shows an **Image rules** panel listing the six
   seeded rules, each with its detail and a working switch.
2. Switching one off persists (the next hero prompt drops that line — backend SPEC-288),
   and the page reflects it after a reload.
3. Adding a rule with a label and detail creates an `image` rule and it appears in the
   list.
4. The panel reads correctly in both themes and at phone width; tokens only.
5. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green; the Spotlight
   doc's Brand Brain section mentions the image rules (Rule 11).

## Verification

- `npm test` — 165 files, **1864 passed**; `npx tsc --noEmit` 0 errors; `npm run lint`
  0 errors (3 pre-existing warnings elsewhere); `npm run build` green.
- Verified against the live store on a reload-free pair (`:8102` backend, `:3102`
  production frontend) with `tools/capture_image_guardrails_0922.mjs`: the **Image
  rules** panel lists all six rules with their details and six working switches, under
  Claims policy; captured in light and dark; no console or page errors.
- Acceptance: 1 done · 2 done (the switch persists; backend SPEC-288's test proves the
  prompt drops the line) · 3 done · 4 done · 5 done.
