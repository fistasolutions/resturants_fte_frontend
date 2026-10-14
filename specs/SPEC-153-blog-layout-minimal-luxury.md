# SPEC-153 — Spotlight blog detail: "Minimal Luxury (LV)" reading layout (Layout 05)

**Repo:** `ecommerce-fte-frontend`
**Status:** implemented
**Depends on / extends:** SPEC-151 (LV-caliber layout + refine progress animation),
SPEC-150 (premium magazine layout: `splitBodyIntoSections` / `planBlogGalleries`),
SPEC-124 (rich blog: TOC / FAQ / shop-the-look), SPEC-126 (deterministic render),
SPEC-122 (art-directed hero), SPEC-117 (refine loop).
**Design reference:** `ref/spotlight-blog-layouts-mockup.html` → `#l5` (Layout 05,
"Minimal Luxury"), owner-approved. Implemented with the app's **design tokens** and
**`font-heading`** (Tenor Sans) — the mock's Cormorant/hardcoded palette is a reference
for STRUCTURE only (root Rule 9: semantic tokens only, never Cormorant, never hardcoded
colors).

## Why

The Spotlight blog **detail** reading experience (SPEC-151) overlays the title on the
hero image and keeps a sticky TOC rail. The owner approved the **Layout 05 "Minimal
Luxury"** direction from the mockup instead: a quiet-luxury, Louis-Vuitton-magazine feel —
vast whitespace, an **oversized centered title ABOVE** a full-width cinematic image, a
single centered reading column, and a text/image split for magazine contrast. This spec
rebuilds the reader content column to that structure while keeping every existing behavior
(art-directed hero generate/regenerate, the refine → progress animation, approve/request-
changes, quality scorecard, delete) and the internal draft-review aside fully intact.

## Scope / product-constitution check

- **Frontend only** (Rule 1). No API surface change — same `getDraft`, same
  `generateHero` / `regenerateDraftStream` actions, same `heroUrl` served image.
- **Rule 8 (backend calculates / AI interprets):** unchanged — galleries, the split pane,
  and "Shop the edit" show ONLY the real grounded product images/titles
  (`grounding.products[]`); nothing is invented. `BlogDraftProduct` carries **no price**,
  so the L5 shop cards show the product photo + title + a store link and **never fake a
  price** (the mock's "$148" is placeholder-only).
- **Rule 9 (design system):** semantic tokens only (`text-foreground`,
  `text-muted-foreground`, `bg-secondary`, `bg-card`, `border-border`, `font-heading`),
  8px rhythm, both themes. **NO framer-motion, NO entrance animations** — content renders
  instantly in its final position; the only motion is CSS hover/focus (gallery/card zoom)
  and the CSS-only skeleton/pulse of the refine progress animation.
- **Rule 6:** graceful degrade — zero product images → no galleries and no split (pure
  centered prose); few images → the split still appears, galleries thin out; failed refine
  reopens the prompt modal with the message + typed instruction intact (unchanged).

## L5 structure (each piece mapped to real draft data)

1. **Centered title block (title ABOVE the image).** A small uppercase tracked **eyebrow**
   (`povPillar`, falling back to "the store · Journal"), then the **oversized centered
   `font-heading` title** (`draft.title`, `text-[clamp(2.25rem,6vw,5rem)]`), then a
   centered **meta** line ("By the Editorial team · {draftReadMinutes(wordCount)} min ·
   For {persona}"). Generous top whitespace.
2. **Full-width cinematic hero BELOW the title — NO overlaid text** (`BlogHero`, new). Same
   image logic as `BlogBanner`: the served art-directed hero (`heroUrl(draft.id,
   heroVersion)`) with a load/error probe that falls back to the featured product photo,
   then to a token gradient. Breaks out to the card's interior edges. The
   generate/regenerate control stays in the review aside ("Editorial header") and drives
   this hero via `heroSrc` + `onHeroLoad`/`onHeroError`; the refine/streaming loader still
   replaces the body while regenerating.
3. **Centered body column.** `readingBody` (via `splitBodyFaq`) rendered by `BlogMarkdown`
   at a comfortable centered measure (`max-w-[60ch] mx-auto`), a **slightly larger body
   font** (`BlogMarkdown size="lg"`), a **drop-cap** on the first paragraph, and the
   **meta description as a centered lede** above the body.
4. **Image/text split + galleries.** New pure planner `planL5Flow` (built on
   `splitBodyIntoSections` + `planBlogGalleries`) interleaves the real product images:
   most as **full-width galleries** (`BlogGallery`) and **at least one as the L5 split**
   (`BlogSplit`, new — a product image beside a `bg-secondary` text pane with a
   `font-heading` sub-head taken from a `## H2` section). Degrades gracefully with few
   images.
5. **"Shop the edit"** — `ShopTheLook`, restyled to the L5 card grid (centered
   `font-heading` heading, 3-up cards: 4:5 product photo + title + store link; no price).
6. **FAQ** accordion (`BlogFaq`) as today; the schema.org **JSON-LD stays in the page
   head** (unchanged, `app/(app)/spotlight/draft/[id]/page.tsx`).
7. **No left TOC rail** (L5 has none): the reading `BlogToc`/`BlogTocDetails` are dropped
   from this layout and `blog-toc.tsx` is deleted (no other importer; Rule 6 — no dead
   code). The page grid returns to `lg:grid-cols-[minmax(0,1fr)_320px]` — the article
   column + the **review aside** (Editorial header / Written-by / Grounded-on / Quality &
   publish / PublishDecision / refine loop), kept fully intact.

## What changes

### `lib/spotlight.ts`
- New `L5FlowItem` union (`section | gallery | split`) and pure planner
  `planL5Flow(sections, products, options)`. It reserves ONE mid-body section + ONE
  grounded image (the last imaged one, leaving earlier images — incl. the hero product —
  for galleries) for the split pane, plans the remaining sections/images with
  `planBlogGalleries`, then re-weaves the split back in at its original document position
  (keyed by the preceding section's slug id). Degrades: no images OR no sections → falls
  back to `planBlogGalleries` (no split); one image → split only, no galleries; every
  section is represented exactly once and every image placed exactly once (never lost,
  never duplicated across a gallery and the split).

### `features/spotlight/blog-hero.tsx` (new)
- Textless full-width cinematic hero band reusing `BlogBanner`'s image resolution +
  invisible-`<img>` load/error probe (served hero → product photo → token gradient), the
  `generating` overlay, and the `onHeroLoad`/`onHeroError` callbacks — with NO scrim and
  NO overlaid title (the title lives above it in L5). `aspect-[3/2]` for the generated
  hero (no crop), a capped tall band for the product-photo fallback.

### `features/spotlight/blog-split.tsx` (new)
- The L5 magazine split: a grounded product image beside a `bg-secondary` pane with an
  eyebrow, a `font-heading` sub-head (the section heading, carrying the section's slug
  `id` + `scroll-mt-24` so deep links still land), the section prose (heading line
  stripped so it isn't shown twice), and a store link. CSS-only hover motion; both themes.

### `features/spotlight/blog-markdown.tsx`
- Optional `size?: "base" | "lg"` prop (default `"base"` — backward compatible). `"lg"`
  renders the prose one step larger for the L5 centered column; everything else unchanged.

### `features/spotlight/shop-the-look.tsx`
- Restyled to the L5 "Shop the edit" card grid: centered `font-heading` tracked heading,
  full content width, 3-up bordered cards (4:5 photo + title + store-link affordance),
  CSS-only hover lift. Still built only from real grounded products; no faked price.

### `features/spotlight/blog-detail.tsx`
- Reader column rebuilt to the L5 structure above: centered title block → `BlogHero` →
  centered lede → drop-cap intro + `planL5Flow` interleave (galleries full-bleed, one
  split) → "Shop the edit" (full width) → FAQ (centered). The drop-cap section id is
  derived from the L5 flow's first prose section (so it is never placed on a section
  consumed into the split). The review **aside is unchanged**. TOC removed. Refine
  progress animation, hero wiring, delete, and the refine dialog are unchanged.

### `features/spotlight/blog-toc.tsx` (deleted)
- No importer after the TOC is dropped from the L5 layout (Rule 6 — no dead code). The
  `TocItem` type stays (used by `draft.toc` / JSON-LD).

## Acceptance criteria

1. Title block is centered ABOVE the hero: uppercase eyebrow, oversized centered
   `font-heading` title (clamped), centered meta line. Vast top whitespace.
2. The hero is a full-width cinematic band BELOW the title with **no overlaid text**; it
   still shows the served art-directed hero when present, falls back to the featured
   product photo, then a token gradient. Generate/Regenerate header (in the aside) updates
   it; the "Generate/Regenerate" label still tracks whether a hero exists.
3. Body is a single centered column at `max-w-[60ch] mx-auto`, slightly larger font, with
   a drop-cap on the first paragraph and the meta description as a centered lede.
4. At least one **split pane** (image + `bg-secondary` text pane, `font-heading` sub-head)
   renders when there are ≥1 grounded image and ≥1 section; remaining images render as
   full-width galleries. No section prose is duplicated between the split and the body.
5. "Shop the edit" renders the 3-up product-card grid (image + title + link, no faked
   price); FAQ accordion renders; JSON-LD stays in the page head.
6. No left TOC rail; the review aside (Editorial header / Written-by / Grounded-on /
   Quality & publish / PublishDecision / refine loop) is fully intact and working.
7. Zero product images → no galleries and no split (pure prose, never broken/empty). Fully
   responsive (title clamps, hero scales, galleries/cards reflow, split stacks on mobile),
   keyboard-navigable, ARIA-labelled, correct in both themes.
8. Refine / "Request changes" still shows the staged `BlogGenerationProgress` animation
   (not live typing); a failed refine reopens the modal with message + instruction intact.
9. No entrance animations, no framer-motion; only CSS hover/focus + the CSS-only
   skeleton/pulse.
10. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Tests (Vitest, node env) — `tests/spotlight-blog-layout.test.ts` (extended)

New `planL5Flow` cases (existing `splitBodyIntoSections` / `planBlogGalleries` /
`appendProgressPhase` tests unchanged):
- No images → all sections as `section` items, no `split`, no `gallery`.
- Images but no sections → galleries alone (`planBlogGalleries` fallback), no `split`.
- Sections + images → exactly one `split`; its `product` has an image; its `section` is a
  real section rendered ONCE (not also as a `section` item); every section id is
  represented exactly once across `section` + `split`; every imaged product placed exactly
  once across galleries + the split (none lost, none duplicated); document order preserved.
- One image + sections → one `split`, zero galleries.

## Manual verification checklist

- [ ] Draft with ≥6 grounded images + ≥4 `## H2` sections: centered oversized title above a
  full-width textless hero; centered 60ch body with drop-cap; interleaved full-bleed
  galleries + one image/text split; "Shop the edit" 3-up grid; FAQ accordion.
- [ ] Toggle dark mode: title, hero, lede, body/drop-cap, split pane (`bg-secondary`),
  shop cards, FAQ all correct in both themes.
- [ ] Resize mobile / tablet / laptop / 2xl: title clamps, hero scales, galleries reflow
  and bleed to the card edges, the split stacks (image over pane), shop cards reflow; no
  horizontal page scroll.
- [ ] Generate header (none) → "Generate header"; after generating → hero repaints and the
  control reads "Regenerate header".
- [ ] "Request changes" → prompt modal → submit → staged progress animation (Researching →
  Writing → Scoring → Revising → Final), NOT live typing → the refreshed finished draft.
- [ ] A refine error reopens the modal with the message and the typed instruction intact.
- [ ] Delete draft still works; review aside panels all present and functional.
- [ ] Load the page: nothing animates in; everything is in its final position at paint.
- [ ] A draft with zero grounded images: pure centered prose, no galleries, no split, no
  broken frames.

## Patches

### 2026-08-21 — Live-draft fixes: hero empty state + full-width centered reader

Two owner-reported problems on a live draft, fixed without changing any behavior:

**1. No giant empty grey hero band.** `BlogHero` rendered a tall
`h-[46vh]…lg:h-[62vh]` token-gradient band even when a draft had **no generated hero
AND no product photo** to fall back to — a huge blank that reads as broken.

- New pure helper `resolveHeroImage(heroUrl, heroFailed, imageUrl)` in `lib/spotlight.ts`
  returns `{ backgroundImage, showHero, hasImage }` — the single source of truth for what
  `BlogHero` paints (served hero → product photo via `shopifyImageUrl` → none). Unit-tested.
- `blog-hero.tsx` uses it: with a real image (`hasImage`) the full-width band is unchanged
  (`aspect-[3/2]` for the served hero, a capped tall band for the product photo). With **no
  image at all** it now renders a **compact placeholder** — a short `h-[34vh] max-h-[360px]`
  token-gradient band with a centered `font-heading` prompt ("Design a magazine header for
  this post") + a subtle `ImageIcon` — inviting the "Generate header" action instead of
  showing a broken blank. Tokens only, both themes, no entrance animation.

**2. Full-width centered L5 reader (no right-side dead space).** The article was trapped in
the article column of a `lg:grid-cols-[minmax(0,1fr)_320px]` grid beside the draft-review
`<aside>`, so it never got the mock's full-width, centered, quiet-luxury feel.

- `blog-detail.tsx` restructured: the ARTICLE (title block → full-width hero → centered
  60ch body → galleries/split → Shop-the-edit → FAQ) now spans a single centered column
  (`mx-auto w-full max-w-5xl`) — the L5 mock feel. The `<aside>`/grid is removed.
- The draft-review controls move to a **slim sticky top action bar** above the article
  (`sticky top-0`, translucent + `backdrop-blur`, `flex-wrap` so it stacks cleanly on
  mobile): back link, status chip, target keyword, overall **Quality score badge**,
  **Generate/Regenerate header**, **Refine draft** (opens `RefineDraftDialog` → the
  non-live staged progress animation, available in every status), **Approve / Request
  changes** (`PublishDecision`, unchanged), and **Delete**.
- Everything else — Written-by + agent trace, Grounded-on (persona/POV/guardrails/internal
  links), the full **Quality & publish** scorecard + "how it was scored", and Researched
  sources — moves into a **"Details" right-side drawer** (shadcn `Sheet`) opened from the
  bar. Every capability stays reachable and working; no function dropped.
- Refine → progress animation, hero generate/regenerate wiring, the JSON-LD in the page
  head, and the galleries/split are all intact.

**Tests:** `tests/spotlight-blog-layout.test.ts` extended with a `resolveHeroImage` block
(served hero wins; product-photo fallback is width-sized; failed hero falls back to the
photo; no hero + no photo → `backgroundImage: null` / `hasImage: false` → compact
placeholder). Existing `planL5Flow` / `splitBodyIntoSections` / `planBlogGalleries` /
`appendProgressPhase` cases unchanged.

**Manual verification checklist (this patch):**
- [ ] Draft with no generated hero and no product photo: hero is a **compact** placeholder
  band with the `font-heading` prompt + image icon — **no tall empty grey band**.
- [ ] Draft with a product photo but no generated hero: the tall photo band still shows.
- [ ] Draft with a generated hero: the `aspect-[3/2]` served hero still shows.
- [ ] Reader is a single **full-width centered** column — **no right-side dead space**.
- [ ] Top action bar exposes: status chip, keyword, quality badge, Generate/Regenerate
  header, Refine draft, Approve & publish / Request changes, Delete — all working.
- [ ] "Details" drawer opens with Written-by + trace, Grounded-on, full Quality scorecard +
  "how it was scored", Researched sources — all present and functional.
- [ ] Generate header (none) → "Generate header"; after generating → hero repaints, control
  reads "Regenerate header".
- [ ] Approve/publish, Request changes, Refine (staged animation, not live typing), Delete
  all work; a refine error reopens the modal with message + instruction intact.
- [ ] Both themes correct; responsive (bar wraps/stacks on mobile, no horizontal scroll);
  keyboard-navigable, ARIA-labelled; nothing animates in on load.
