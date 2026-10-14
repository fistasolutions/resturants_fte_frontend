# SPEC-263 — Brand Brain v2: its own shell, eight sub-tabs, only the section loads

**Status:** implemented · **Date:** 2026-09-17 · **Repo:** frontend · **Backend:** `SPEC-263-brand-brain-v2.md` · **Extends:** SPEC-109 (Spotlight shell), SPEC-111 (Brand Brain CRUD), SPEC-232 (persistent shells), SPEC-230 (client cache) · **Mockup:** `ref/mockups/brand-brain-v2.html` (owner-approved 2026-09-17)

## Why

Brand Brain was one 800-line tab under Spotlight: identity, voice, guardrails,
personas, proof points and the intent-template editor in a single scroll. The owner
approved a v2 with eight sub-tabs (Coverage · Files · Facts · Voice · Guardrails ·
Personas · Measured · History) and one rule: **the Spotlight tab bar and the Brand
Brain sub-tab bar stay put; switching a sub-tab loads that section's data, never the
layout.** That is the SPEC-232 shell pattern, nested one level deeper.

## Routes

```
app/(app)/spotlight/layout.tsx                  → <SpotlightShell>         (unchanged file; shell now
                                                                             keeps header + tabs on /spotlight/brand-brain/*)
app/(app)/spotlight/brand-brain/layout.tsx      → <BrandBrainShell>        (header strip + sub-tab bar, persistent)
app/(app)/spotlight/brand-brain/page.tsx        → redirect("/spotlight/brand-brain/coverage")
app/(app)/spotlight/brand-brain/[section]/page.tsx   → prefetches the section's queries, renders <BrandBrainSection>
app/(app)/spotlight/brand-brain/[section]/loading.tsx → content-only skeleton
```

- `SpotlightTabs` links Brand Brain to `/spotlight/brand-brain`; `SpotlightShell`
  treats any `/spotlight/brand-brain…` pathname as the `brand-brain` tab being active
  (it used to pass every non-`/spotlight` path through bare — Brand Brain now needs
  the outer shell kept). `/spotlight?tab=brand-brain` redirects, so shared links keep
  working.
- `lib/brand-brain.ts` owns the sub-tab vocabulary (`BRAND_BRAIN_SECTIONS`, labels,
  `isBrandBrainSection`, `brandBrainHref`), the snake→camel adapters, and the pure
  helpers (`coverageTone`, `sourceKindLabel`, `groupFactsBySection`, `pendingCount`,
  `rulesOfKind`, `wrongForms`, `anyExtracting`, `highlightHits`, `eventKindLabel`) —
  unit-tested in `tests/brand-brain.test.ts`.

## Sections

| Sub-tab | Query | What it shows / does |
| --- | --- | --- |
| Coverage | `coverage` | Score ring, approved / awaiting / empty counts, "What is still missing" (each row links to the sub-tab that fixes it), where the brain is used (30 d), sections with progress bars and source chips. |
| Files | `sources` (+ `sourceFacts(id)`) | Drop zone (PDF · DOCX · CSV · TXT · MD, ≤ 10 MB) + "Paste a URL"; the source list with status (`extracting` polls every 2 s until `ready`/`failed`); the selected source's facts with Approve / Reject / Approve all; conflicts flagged with the approved value; Re-check; Delete. |
| Facts | `facts` | Every fact grouped by section with status and provenance chips; inline edit (SPEC-111 rows); add fact; enable/disable switch on guardrail rows; "pending" rows carry Approve / Reject too. |
| Voice | `voice` | Samples (add / delete), derived rules (switch, edit), **Derive rules** (needs ≥ 3 samples), the **Does this sound like us?** checker: textarea → score, verdict, findings, banned hits highlighted, **Rewrite in the store's voice** fills the box. |
| Guardrails | `facts` + `rules` | Positioning rules (guardrail facts as switches), Never use / Always say (word chips; type + Enter adds; × removes), Claims policy switches, Religious calendar (dated rules; add). |
| Personas | `brandBrain` | Persona cards with source chip; Confirm on unsourced; edit / add / delete as before. |
| Measured | `brandBrain` | The measured proof points as a read-only table. |
| History | `history` | Newest first: when, what, who. |

The intent-template editor leaves Brand Brain and lands in Inbound Engine under a
collapsed **Advanced** section (owner decision from the Spotlight critique).

## Data

`lib/queries/brand-brain.ts` — `coverage`, `sources`, `sourceFacts(id)`, `facts`,
`voice`, `rules`, `history`; `services/brand-brain-actions.ts` — the writes
(`uploadSource` multipart, `addUrlSource`, `recheckSource`, `deleteSource`,
`approveFact`, `rejectFact`, `approveAllFacts`, `setFactEnabled`, `addRule`,
`updateRule`, `deleteRule`, `addVoiceSample`, `deleteVoiceSample`, `deriveVoice`,
`checkVoice`, `updateVoiceRule`, `confirmPersona`). Every write invalidates the
`["brand-brain"]` prefix so the sub-tabs and Coverage agree without a reload.
Types in `types/brand-brain.ts`.

## Acceptance criteria

- [x] Switching sub-tabs re-renders only `{children}` of `BrandBrainShell` (the
  Spotlight header + tabs and the Brand Brain strip + sub-tabs never remount).
  Measured with Playwright on 2026-09-17: the four marked DOM nodes (Spotlight `h1`,
  its tab bar, the Brand Brain strip, the sub-tab bar) survived all seven switches;
  exactly **one** RSC request and **zero** client API calls per switch (the section's
  data streams with the page prefetch); Files → 1.9 s, Facts 2.8 s, Voice 2.8 s,
  Guardrails 1.9 s, Personas 4.3 s (the brain read carries the seven measured
  metrics), Measured 0.1 s (same query, already cached), History 0.03 s. The remote
  dev database answers a single query in ~650 ms today, which is the floor under
  every first visit.
- [x] `/spotlight?tab=brand-brain` → `/spotlight/brand-brain/coverage`; an unknown
  section → `notFound()`.
- [x] Upload shows the row as *Extracting…* and polls to *ready* without a reload;
  its facts appear on the right with Approve / Reject; Approve all clears them;
  Coverage's score and counts change accordingly. Live: a real size chart → 6 facts
  in 18 s → Approve all (6) → Coverage 63 % → 76 %.
- [x] Voice check renders findings from the backend; a banned word is highlighted in
  the text; "Use the rewrite" replaces the text. Live: "unbeatable" highlighted, three
  computed findings; after deriving 5 rules from 3 samples the judged check returned
  50 · sent back with a rewrite.
- [x] Guardrail switches, word chips and calendar rules persist (reload shows the
  same state).
- [x] `tests/brand-brain.test.ts` covers the pure helpers; `tests/docs.test.ts` still
  green; `npm test`, `tsc --noEmit`, `npm run build` green.
- [x] Docs: `lib/docs/content/spotlight.ts` Brand Brain section rewritten for the
  eight sub-tabs; `updated` bumped.
- [x] Tokens only; no entrance animation; both themes.

## Manual verification checklist

- [ ] Upload a real PDF (a size chart) → facts extracted with page locators.
- [ ] Paste the about-us URL → facts extracted.
- [ ] Approve two, reject one, Approve all → Coverage updates.
- [ ] Type "unbeatable prices!" into the voice checker → banned hit, score ≤ 59.
- [ ] Add a banned word, reload, still there.
- [ ] Light and dark themes both legible.
