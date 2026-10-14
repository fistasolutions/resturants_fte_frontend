# SPEC-151 — LV-caliber blog layout + refine uses the new-blog progress animation

**Repo:** `ecommerce-fte-frontend`
**Status:** implemented
**Depends on / extends:** SPEC-150 (premium magazine layout), SPEC-124 (rich blog:
TOC / FAQ / shop-the-look), SPEC-126 (deterministic render), SPEC-117 (refine loop),
SPEC-115 Patches / SPEC-121 (first-generation harness progress animation).

## Why

Two problems remain on the Spotlight blog **detail** page after SPEC-150:

1. **Side-space imbalance.** The editorial body text renders at a narrow, **left-aligned**
   `max-w-prose` inside a wide card, leaving a large band of **dead empty space on the
   right**. It reads unbalanced — not the centered, art-directed composition the brand
   aspires to (reference feel: a Louis Vuitton magazine article — a centered, balanced
   editorial column with full-bleed imagery and elegant rhythm).

2. **Two different "the writer is working" experiences.** Creating a NEW blog shows a
   staged **progress animation** (`BlogGenerationProgress` — Researching → Writing →
   Scoring → Revising → Final), because the multi-round quality harness discards
   intermediate drafts (SPEC-121). But **refine / "Request changes"** instead streams
   the body **live** token-by-token (`BlogStreamingBody`). The two flows should feel the
   same: refine should show the exact same non-live progress animation the new-blog flow
   shows.

## Scope / product-constitution check

- **Frontend only** (Rule 1). No API surface change; the regenerate endpoint
  (`regenerateDraftStream`, backend SPEC-113) is still called — its streamed body
  **deltas are ignored**, exactly as the new-blog surface already ignores them, and only
  its `status` frames drive the progress animation.
- **Rule 8 (backend calculates / AI interprets):** unchanged — galleries still show only
  the real grounded product images; no number/image is invented.
- **Rule 9 (design system):** semantic tokens only (`text-foreground`,
  `text-muted-foreground`, `border-border`, `bg-muted`, `font-heading`), 8px rhythm,
  both themes. **NO framer-motion, NO entrance animations** — content renders instantly
  in its final position; the only motion is CSS hover/focus (gallery zoom/caption) and
  the CSS-only skeleton/pulse of the progress animation (already SPEC-115/121).
- **Rule 6:** graceful degrade — zero product images → no gallery bands; failed refine
  reopens the prompt modal with the message + typed instruction intact (unchanged).

## What changes

### FIX 1 — LV-caliber, balanced, full-bleed layout (`blog-detail.tsx`, `blog-toc.tsx`)

- **Centered reading column.** Every text block (standfirst, drop-cap intro, each `## H2`
  section, Shop-the-Look, FAQ) is centered with `mx-auto` at a comfortable editorial
  measure (`max-w-[68ch]`), so prose is balanced in the card instead of hugging the left
  with dead space on the right.
- **Full-bleed galleries.** `BlogGallery` bands break out of the text measure to the
  card's interior edges with `-mx-5 md:-mx-8` (exactly cancelling the `CardContent`
  `p-5 md:p-8` padding — symmetric, never overflows; the `Card` is `overflow-hidden`).
  The magazine contrast: narrow centered prose against wide edge-to-edge photography.
- **Sticky TOC on wide screens, without stealing editorial width.** The wide-screen
  `BlogToc` moves **out of the reading card** into a dedicated left rail of the page grid
  at `2xl` (`2xl:grid-cols-[200px_minmax(0,1fr)_320px]`, sticky, only rendered when
  `hasToc`), so it never competes with the centered column or the full-bleed bands.
  Below `2xl` the collapsible `BlogTocDetails` (now `2xl:hidden`) sits at the top of the
  article. The right quality/review aside is untouched.
- **Rhythm.** Standfirst `mb-10`; sections `mt-12 md:mt-14`; galleries keep `my-10
  md:my-12`; drop-cap on the intro's first paragraph (or the first section's when there
  is no intro); pull-quotes and `font-heading` section headings unchanged. All on the 8px
  scale.
- `BlogToc` gains an optional `className` (single-use component) so the caller controls
  its visibility + sticky placement in the new left rail; `BlogTocDetails` switches from
  `xl:hidden` to `2xl:hidden`.

### FIX 2 — Refine shows the new-blog progress animation, not live typing (`blog-detail.tsx`, `refine-draft-dialog.tsx`, `blog-draft-streaming.tsx`, `lib/spotlight.ts`)

- The refine loop no longer renders `BlogStreamingBody` (live token typing). On submit it
  shows the **same** `BlogWritingLoader` + `BlogGenerationProgress` staged animation the
  new-blog flow shows, driven by the accumulated `status` frames; the streamed body
  deltas are **ignored** (`onDelta` omitted), mirroring `BlogDraftStreaming`. When the
  stream ends it `router.refresh()`es to the finished draft (the settling ref keeps the
  animation up until the refreshed draft paints).
- Both entry points funnel through one path: "Request changes" (`PublishDecision.
  onRequestChanges` → `openRefine`) opens `RefineDraftDialog`; submit runs
  `handleRegenerate`, which shows the progress animation. Consistent.
- New pure helper `appendProgressPhase(phases, phrase)` in `lib/spotlight.ts` — appends a
  harness phrase to the timeline, collapsing a consecutive duplicate so a repeated frame
  never adds a second row. Used by BOTH `BlogDraftStreaming` (replacing its inline
  duplicate) and the refine loop (DRY, unit-tested).
- `RefineDraftDialog` copy no longer says the rewrite happens "live" (it is now the staged
  animation).
- The now-unused `features/spotlight/blog-streaming-body.tsx` is deleted (no other
  importer; Rule 6 — no dead code).

## Acceptance criteria

1. Reading column is centered (`mx-auto`); no large dead space on the right in either
   theme, at any width.
2. `BlogGallery` bands are full-bleed to the card's interior edges, clearly wider than the
   centered prose; no horizontal page overflow at any breakpoint.
3. Drop-cap intro, `font-heading` section headings, pull-quotes, and 8px vertical rhythm
   preserved; standfirst renders as a larger deck above the body.
4. Sticky wide-screen TOC still present (left rail at `2xl`) and its jumps land on the
   right section headings; collapsible TOC works below `2xl`. Right quality/review aside
   intact.
5. Zero product images → no gallery bands (never broken/empty). Fully responsive
   (galleries reflow, hero scales), keyboard-navigable, ARIA-labelled.
6. Refine / "Request changes" shows the **same** staged `BlogGenerationProgress`
   animation as a new blog — **no** live token typing anywhere in refine.
7. A failed refine reopens the prompt modal with the message + typed instruction intact;
   on success the finished draft is shown via `router.refresh()`.
8. `BlogStreamingBody` is no longer used by refine (file removed).
9. No entrance animations, no framer-motion. Only CSS hover/focus + the CSS-only
   skeleton/pulse.
10. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Tests (Vitest, node env)

- `tests/spotlight-blog-layout.test.ts` (extended): `appendProgressPhase` — appends a new
  phrase; collapses a consecutive duplicate; keeps a non-consecutive repeat; returns the
  same array reference when collapsing (no needless re-render); starts from empty.
- Existing `splitBodyIntoSections` / `planBlogGalleries` tests unchanged (layout split /
  gallery interleave logic is untouched).

## Manual verification checklist

- [ ] Draft with ≥6 grounded images, ≥4 H2 sections: centered narrow prose with wide
  full-bleed gallery bands; no dead space on the right; reads like an LV editorial.
- [ ] Toggle dark mode: centered prose, galleries, standfirst, drop-cap all correct.
- [ ] Resize mobile / tablet / laptop / 2xl: galleries reflow and bleed to the card edges,
  hero scales, no horizontal scroll; left-rail TOC appears only at 2xl, collapsible TOC
  below it.
- [ ] TOC jumps (rail + collapsible) land on the correct section headings.
- [ ] "Request changes" → prompt modal → submit → the staged progress animation
  (Researching → Writing → Scoring → Revising → Final), NOT live typing → the refreshed
  finished draft.
- [ ] A refine error reopens the modal with the message and the typed instruction intact.
- [ ] Load the page: nothing animates in; everything is in final position at paint.

## Patches

_(none yet)_
