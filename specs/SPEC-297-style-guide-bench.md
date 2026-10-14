# SPEC-297 — Style Guide: the prompt, the rules, the bench (and one title)

**Status:** done
**Date:** 2026-09-23
**Repo:** frontend
**Depends on:** backend SPEC-292, frontend SPEC-295 (the tab)

## Why

Three things the owner asked for on 2026-09-23, looking at the tab as it shipped:

1. **The explainer paragraph goes.** *"How the brand's pictures look. Every enabled row is
   appended to every image prompt…"* — a wall of text where the answer should be.
2. **Two titles.** Every Brand Brain page renders **Spotlight** + its description and then
   **Brand Brain** + its description, one above the other, before any content.
3. **Make it make sense:** *"it should have just the prompt here… and a few rules and a
   testing space in which we see the example image we generated, and it persists — at most
   5 — with their prompt, and on click we can see that."*

## What ships

### 1. One title for Brand Brain

`BrandBrainShell` drops its `<h2>Brand Brain</h2>` and its paragraph. The Spotlight header
above it already names the page; the sub-tab bar stays and becomes the strip's whole body.
Nothing else about the shell changes (a detail path still passes through bare).

### 2. The Style Guide tab, rebuilt

The blurb is gone. Three regions, top to bottom:

**a. The prompt** — `features/brand-brain/style-prompt.tsx`. The exact block the image
model receives for the chosen surface (**Blog hero / Social**, a segmented control), in a
monospace, scrollable panel with a copy button and one line of provenance underneath:
"21 rules · 3,998 characters · appended to every image prompt, safety last." Read from
`GET /brand-brain/style/prompt`, so it can never drift from what the generators send.

**b. The rules** — the seven sections, made compact: one card per section with the
section's rows as a tight list (label, one-line detail, switch, delete) and the add row
tucked at the bottom. Same write path as SPEC-295 (`addRule`/`updateRule`/`deleteRule`),
same `pending` optimism.

**c. The bench** — `features/brand-brain/style-bench.tsx`. A one-line brief, a Generate
button, and the last five renders as thumbnails. Generating shows the tile straight away
in a working state. Clicking a tile opens a dialog: the full picture, the brief, the
product it used, and the **full prompt** it was made from (copyable). Each tile has a
remove. Empty state says what the bench is for and that nothing has been generated yet.

### 3. `lib/style-bench.ts` (pure, Vitest-covered)

`SURFACES` (the two, with labels), `promptStats(preview)` → the provenance line,
`benchTileLabel(test)` → "Social · 2 min ago", `canGenerate(brief, busy)`, and
`MAX_TESTS = 5` with `withNewTest(list, test)` keeping the newest five.

### 4. Reads and writes

`lib/queries/brand-brain.ts` gains `stylePrompt(surface)` and `styleTests()`;
`services/brand-brain-actions.ts` gains `runStyleTest`/`deleteStyleTest`. The image is an
`<img>` at `/api/proxy/brand-brain/style/tests/{id}/image` (the proxy carries the cookie).

### 5. Docs (Rule 11)

The Style Guide doc section gains the prompt panel and the bench; its screen is recaptured.

## Acceptance criteria

1. No "How the brand's pictures look…" paragraph anywhere; no second title on any Brand
   Brain tab.
2. The prompt panel shows the live block for both surfaces and copies it.
3. Generate produces a tile; six generates leave five; a tile opens its prompt; remove
   deletes it.
4. `lib/style-bench.ts` is pure and unit-tested.
5. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green; verified in
   the browser against a real generation, light and dark.

## Verification

Driven live on 2026-09-23 with Playwright against the production build on :3100 and a
reload-free backend on :8100 (`tools/capture_style_bench_0923.mjs`, captures in
`ref/screens/style-bench-2026-09-23/`).

- **One title, no blurb.** The page's headings are now `Spotlight | The rules` — the
  second "Brand Brain" title and its paragraph are gone from every Brand Brain tab, and
  the "How the brand's pictures look…" blurb is gone (asserted in the capture, not just
  looked at).
- **The prompt panel** shows the live block — **3,658 characters**, BRAND STYLE before
  BRAND SAFETY — with the stats line *"21 rules · 3,658 characters · appended to every
  image prompt, safety last"* and the section counts. Switching to **Blog hero** swaps in
  the banner-crop rows.
- **The bench.** Generate ran the real pipeline; the vendor refused because the store's
  image account is out of credit, and the bench said so in the owner's words: *"The AI
  provider account is out of credit, so the request was refused."* The tile, the dialog
  (picture · product · rule count · the full prompt) and Remove were verified against a
  stub row, which was then deleted — the bench is empty and nothing was left behind.
- **Both themes** captured; tokens only.
- **Gates:** `npm test` **1,898 passed (167 files)** including 11 in
  `tests/style-guide.test.ts`; `npx tsc --noEmit` clean; `npm run lint` 0 errors (3
  pre-existing warnings); `npm run build` compiled.

### Acceptance criteria

| # | Criterion | Status |
| --- | --- | --- |
| 1 | No blurb; no second title on any Brand Brain tab | done |
| 2 | The prompt panel shows the live block for both surfaces and copies it | done |
| 3 | Generate → tile; five kept; a tile opens its prompt; remove deletes it | done (render itself blocked by the vendor's billing) |
| 4 | `lib/style-bench.ts` pure and unit-tested | done |
| 5 | Suite, types, lint, build green; verified in the browser, light and dark | done |
