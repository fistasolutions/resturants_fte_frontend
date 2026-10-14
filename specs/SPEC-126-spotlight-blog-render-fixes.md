# SPEC-126 — Spotlight blog-detail render fixes

**Status:** implemented
**Repo:** frontend
**Depends on / relates to:** SPEC-109 (Spotlight MVP), SPEC-115 (blog images),
SPEC-117 (refine loop), SPEC-122 (rich blog + editorial hero), the rich-blog
reading helpers in `lib/spotlight.ts`.

## Problem

Three defects in the Spotlight blog-detail reading experience:

1. **React hydration mismatch (critical).** `buildComponents()` in
   `features/spotlight/blog-markdown.tsx` derives H2 anchor ids and the
   first-paragraph drop-cap from **render-time mutable counters** — `let
   paragraphIndex` and a per-render `headingCounts` Map fed to
   `uniqueHeadingId`. React can invoke the custom element renderers in a
   different order/count during client hydration than during SSR, so the ids
   and the drop-cap class diverge between server and client. Reported symptom:
   server heading id `what-makes-a-belt-modest` vs client
   `what-makes-a-belt-modest-1`, and the drop-cap present on the server but
   absent on the client → console hydration error.

2. **Hero banner crops the generated image.** The backend generates the hero at
   1536×1024 (a 3:2 landscape composition with deliberate negative space for the
   overlaid title). `features/spotlight/blog-banner.tsx` renders the hero with
   `object-cover object-center` inside a text-driven `min-h-[320px]
   md:min-h-[420px]` box (~1.7:1), cropping the top and bottom of the intended
   composition.

3. **Outbound external links still render live.** The backend is being changed
   to strip outbound external links from the served/published body, but the live
   refine stream still renders raw streamed Markdown that can contain
   `[domain](https://…)` outbound links. The in-app reader must not present
   clickable outbound links.

## Approach

### Fix 1 — deterministic ids + drop-cap (pure, keyed off source line)

Make both decisions deterministic, computed once from the `content` string and
keyed off each node's **source line** — which is stable across SSR and client
because react-markdown passes the parsed hast `node` (with
`node.position.start.line`) to every custom renderer (`passNode: true`).

New pure helpers in `lib/spotlight.ts` (unit-tested):

- `headingIdsByLine(content: string): Map<number, string>` — scan the Markdown
  for `## ` H2 lines **in order** using the existing `_H2_LINE_RE`; for each,
  compute its id with the existing `uniqueHeadingId` + a single fresh `Map` (so
  the `-1`/`-2` dedup still mirrors the backend `table_of_contents` and matches
  `draft.toc`); key the result by the 1-based line number of that `##` line.
- `firstParagraphLineNumber(content: string): number | null` — the 1-based line
  number of the first non-blank line that is **not** a heading (`#…`), list item
  (`-`/`*`/`+`/`\d+.`/`\d+)`), blockquote (`>`), thematic break (hr), code fence
  (```` ``` ```` / `~~~`), or table row (`|`). Used for the drop-cap.

In `blog-markdown.tsx`:

- Add `"use client"` (it now uses `useMemo`).
- Compute `headingIdsByLine(content)` and `firstParagraphLineNumber(content)`
  once with `useMemo(…, [content])` inside `BlogMarkdown`.
- `h2` renderer: read `node?.position?.start?.line`, look up the id in the map;
  fallback to `slugifyHeading(text)` (no dedup) when node/line/map-entry missing.
- `p` renderer: apply drop-cap classes only when `enableDropCap &&
  node?.position?.start?.line === firstParagraphLine`.
- Remove the mutable `paragraphIndex` and the per-render `headingCounts` closure
  counters entirely.
- The `node` prop is typed by react-markdown's `Components` map (hast `Element`
  via `ExtraProps`); no `any`.

Visual styling is unchanged.

### Fix 2 — hero renders at native 3:2

In `blog-banner.tsx`, when `showHero` is true, render the banner at
`aspect-[3/2]` so the whole 3:2 generated composition is visible, with the
overlaid eyebrow/title/byline absolutely positioned at the bottom-left over the
existing scrim. The product-photo (`object-cover object-top`) and gradient
fallback modes keep the existing `min-h-[320px] md:min-h-[420px]` behavior. Scrim
gradient kept for legibility; responsive; both themes; no entrance animation.

### Fix 3 — defensive external-link rendering

New pure helper `isExternalHref(href: string): boolean` in `lib/spotlight.ts` —
true for `http://`/`https://` absolute URLs, false for relative / `/products/` /
anchor / other schemes. In the `blog-markdown.tsx` `a` renderer: when
`isExternalHref(href)`, render children as a plain muted citation
(`<span className="text-muted-foreground">`), not a clickable link; otherwise
render the normal internal link. `blog-streaming-body.tsx` reuses `BlogMarkdown`,
so it inherits this treatment (no separate renderer there).

## Files changed

- `lib/spotlight.ts` — add `headingIdsByLine`, `firstParagraphLineNumber`,
  `isExternalHref`.
- `features/spotlight/blog-markdown.tsx` — deterministic ids/drop-cap, defensive
  `a` renderer, `"use client"`.
- `features/spotlight/blog-banner.tsx` — 3:2 hero mode.
- `tests/spotlight-blog-render.test.ts` — new Vitest unit tests.

## Acceptance criteria

- **AC1** `headingIdsByLine` maps each `##` H2 to its 1-based line number, with
  `uniqueHeadingId`-aligned `-1`/`-2` dedup for repeated headings. `done`
- **AC2** `firstParagraphLineNumber` returns the first paragraph line, skipping
  headings, list items, blockquotes, hr, code fences, and table rows; `null` when
  there is no paragraph. `done`
- **AC3** `isExternalHref` is true only for absolute `http(s)` URLs; false for
  relative, `/products/…`, anchors, and empty. `done`
- **AC4** `blog-markdown.tsx` no longer uses mutable render counters; ids and
  drop-cap derive from `node.position.start.line` via the memoized maps. `done`
- **AC5** External hrefs render as muted `<span>`, internal hrefs as links. `done`
- **AC6** Hero banner renders at `aspect-[3/2]`; non-hero modes unchanged. `done`
- **AC7** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green. `done`

## Manual verification checklist (UI)

- [ ] Open a saved Spotlight draft with a generated hero → the whole 3:2 hero
      composition is visible (no top/bottom crop); title/eyebrow/byline sit at
      bottom-left, legible in both light and dark themes.
- [ ] Open a draft whose body contained an outbound `[domain](https://…)` link →
      it renders as muted, non-clickable text (not a link) in both the saved view
      and the live refine stream.
- [ ] Reload a saved draft and watch the browser console → no React hydration
      mismatch warning for heading ids or the drop-cap.
- [ ] TOC links still jump to their headings (ids still match `draft.toc`).
- [ ] Nothing animates into view on load (Rule 9).

## Patches

- **2026-08-13 — quick fix (hero band height):** Fix 2's `aspect-[3/2]` made the
  banner ~800px tall at full article-column width, swallowing the viewport. Replaced
  with a capped magazine-style band — `h-[380px] md:h-[460px] lg:h-[520px]` — keeping
  `object-cover object-center` so the composited hero is framed as a hero band rather
  than displayed full-size. Non-hero (product photo / gradient) modes unchanged.
  `npx tsc --noEmit` clean; class-only change (dev server hot-reloads). Manual check:
  hero reads as a proper banner, not full-screen.

- **2026-08-13 — quick fix (hero fit, responsive):** capped-band `object-cover`
  cropped the model's head. Switched the hero to `object-contain object-center`
  inside the responsive capped-height band (`h-[380px] md:h-[460px] lg:h-[520px]`)
  with a `bg-black` editorial matte behind it (same non-themed treatment as the
  scrim), so the WHOLE composition fits with no crop at every breakpoint. `tsc`
  clean; class-only.
