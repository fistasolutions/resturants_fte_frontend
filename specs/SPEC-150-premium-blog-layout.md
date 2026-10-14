# SPEC-150 — Premium magazine-grade Spotlight blog layout

**Repo:** `ecommerce-fte-frontend`
**Status:** implemented
**Depends on / extends:** SPEC-109 (Spotlight MVP), SPEC-122 (editorial hero),
SPEC-124 (rich blog: TOC / FAQ / shop-the-look / JSON-LD), SPEC-126 (deterministic
blog render), SPEC-117 (refine loop).

## Why

The Spotlight blog **detail** page is the flagship reading surface — a merchant
reviews a fully AI-written editorial before publishing it to their Shopify blog.
Today it renders as a competent but flat **text wall**: hero → meta italic line →
one long `BlogMarkdown` body → shop-the-look → FAQ. It does not read like the
high-end fashion editorial (Vogue / COS / Aritzia caliber) the brand aspires to.

This spec redesigns the reading experience into an **art-directed magazine layout**
that weaves the draft's **real grounded product images** between the article's text
sections, without changing any data contract, any backend call, or any of the
existing review behaviors (hero regenerate, refine/stream loop, TOC jumps, FAQ
split, quality panel, sources, JSON-LD).

## Scope / product-constitution check

- **Frontend only** (Rule 1). No new API surface; consumes the same `BlogDraft`
  (`grounding.products[]` with `imageUrl`/`title`/`handle`/`url`, `toc`, `faq`,
  `metaDescription`, `sources`, `bodyMd`).
- **Rule 8 (backend calculates / AI interprets):** galleries only ever show the
  **real** products the agent grounded on — never invented, never fabricated. No
  price is faked. Images that the backend did not supply (`imageUrl` null) are
  simply not shown.
- **Rule 9 (design system):** semantic tokens only (`bg-muted`, `border-border`,
  `text-foreground`, `text-muted-foreground`, `ring-ring`, `bg-card`,
  `font-heading`), 8px rhythm, shadcn/native elements, both themes.
  **NO framer-motion, NO entrance animations** — content renders instantly in its
  final position; the only motion is CSS hover/focus (image zoom, caption reveal)
  at 200–300ms.
- **Rule 6:** graceful degrade — few products → fewer / one gallery; zero product
  images → no galleries at all (never a broken or empty image band). Keyboard +
  ARIA on every interactive element.

## What changes

### 1. Pure, unit-tested layout logic (`lib/spotlight.ts`)

Three additions (no data fetching, no JSX):

- `splitBodyIntoSections(body): { intro, sections }` — splits the reading body
  (FAQ already lifted out by `splitBodyFaq`) at each `## H2`. `intro` is the prose
  before the first H2; each section is `{ id, heading, body }` where `id` is the
  slug anchor computed with the **same `uniqueHeadingId` dedup, in document order**,
  as `headingIdsByLine` / the backend `toc` — so TOC jumps keep working. `body`
  includes the `## heading` line so `BlogMarkdown` renders it. No H2 → the whole
  body is `intro`, `sections` empty.
- `planBlogGalleries(sections, products, opts?): BlogFlowItem[]` — plans the
  interleave. Only products **with an image** become gallery items. Splits them
  evenly into `groups = clamp(ceil(imaged/maxPerGallery), 1, min(maxGalleries,
  max(1, sectionCount)))` bands (defaults `maxPerGallery: 3`, `maxGalleries: 3`),
  then weaves each band **before** an evenly-spread section index so prose and
  image bands alternate: `intro → [gallery] → section → section → [gallery] → …`.
  Every band is always placed (no empties, none lost). No images → returns the
  sections unchanged (all `kind: "section"`). No sections but images exist → emits
  the galleries after the (whole-body) intro.
- `BlogSection`, `BlogBodyParts`, `BlogFlowItem`, `GalleryPlanOptions` types.

### 2. New component `features/spotlight/blog-gallery.tsx`

An editorial **image band** built from `BlogDraftProduct[]`. Layout adapts to
count: 1 → full-bleed `16/10`; 2 → `4/5` pair; 3 → `4/5` triptych
(`grid-cols-1 sm:grid-cols-3`); 4 → `4/5` quad (`grid-cols-2 sm:grid-cols-4`).
Each image links to its `/products/{handle}` `url` in a new tab (non-link `<div>`
when `url` is null), with an `aria-label="Shop {title}"`, a CSS-only scrim +
"Shop {title}" caption that reveals on hover/focus, and a subtle `object-cover`
zoom on hover. `next/image` `unoptimized` + `shopifyImageUrl(url, 900)` for
right-sized CDN assets (Rule 5). A muted `<figcaption>` names the featured pieces.
Filters out image-less products defensively → never an empty band.

### 3. New prop on `features/spotlight/blog-markdown.tsx`

`headingId?: string` — when set, the (single) `## H2` in a section's markdown uses
that pre-computed anchor id instead of re-deriving it, so per-section rendering
keeps ids globally consistent with `draft.toc` even for duplicate headings. Absent
→ existing line-keyed behavior (unchanged; streaming path unaffected).

### 4. `features/spotlight/blog-detail.tsx` reading column

Replaces the single-body render inside the prose column with the editorial flow:
**standfirst** (meta description as a larger deck, not a bordered italic line) →
**intro** with drop-cap → **interleaved `BlogGallery` bands + section prose** (via
`planBlogGalleries`) → **`ShopTheLook`** → **`BlogFaq`**. Text blocks are held to a
comfortable `max-w-prose` measure while galleries span the full column — the
magazine contrast. Drop-cap lands on the intro's first paragraph (or the first
section's, if there is no intro). Sticky `BlogToc` / `BlogTocDetails`, hero,
refine/stream loop, and the entire right aside (hero control, trace, grounding,
quality & publish, sources) are untouched. JSON-LD stays in the page head.

## Acceptance criteria

1. Hero (`BlogBanner`, 3:2 art-directed, eyebrow/title/byline, `font-heading`)
   renders as today; generate/regenerate header still works.
2. Meta description renders as a larger standfirst/deck above the body.
3. First body paragraph gets a drop-cap; prose has a comfortable measure + leading.
4. Product images appear as editorial `BlogGallery` bands **woven between** the
   article's text sections (not all dumped at the end); each links to its product.
5. Few products degrade gracefully (one/fewer galleries); zero product images →
   no gallery band anywhere (never broken/empty).
6. Sticky TOC on wide screens still jumps to the correct sections (ids match
   `draft.toc`); collapsible TOC on small screens works.
7. `ShopTheLook` conversion grid + `BlogFaq` accordion + Researched sources aside
   render as today; FAQ is still split out of the prose via `splitBodyFaq`.
8. Right aside (hero control, written-by trace, grounded-on, quality & publish,
   sources) intact; refine → streamed regenerate still shows the live writing body.
9. Both light + dark themes; fully responsive (galleries reflow 1↔multi-col, hero
   scales); keyboard-navigable, semantic, ARIA-labelled.
10. **No entrance animations, no framer-motion.** Only CSS hover/focus motion.
11. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Tests (Vitest, node env) — `tests/spotlight-blog-layout.test.ts`

- `splitBodyIntoSections`: intro extraction; one section per H2 with body incl.
  heading; ids match `headingIdsByLine` incl. `-1/-2` dedup; no-H2 → all intro;
  empty body.
- `planBlogGalleries`: no images → sections unchanged; every product placed & every
  section preserved in document order; groups capped by `maxGalleries` and by
  section count; one product → single gallery after intro; no sections + images →
  galleries only; `maxPerGallery` respected.

## Manual verification checklist

- [ ] Draft with ≥6 grounded product images, ≥4 H2 sections: hero → standfirst →
  drop-cap intro → gallery → sections → gallery → … → shop-the-look → FAQ; reads
  like an editorial, not a text wall.
- [ ] Draft with 1 product image: exactly one gallery band, no broken layout.
- [ ] Draft with 0 product images: no gallery bands; body + shop-the-look(hidden)
  + FAQ still fine.
- [ ] TOC (wide + collapsible) jumps land on the right section headings.
- [ ] Refine → regenerate still streams the live writing body in place.
- [ ] Toggle dark mode: galleries, standfirst, captions, drop-cap all correct.
- [ ] Resize to mobile/tablet: galleries reflow, hero scales, no horizontal scroll.
- [ ] Keyboard-tab through gallery links: focus ring visible, caption reveals.
- [ ] Load the page: nothing animates in; everything is in final position at paint.

## Patches

_(none yet)_
