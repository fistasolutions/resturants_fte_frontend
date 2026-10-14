# SPEC-176 — Switching a version repaints instead of downloading

**Repo:** frontend · **Status:** implemented · **Date:** 2026-08-29
**Backend counterpart:** `SPEC-190` · **Builds on:** `SPEC-188` (gallery)

## Problem

Reported as *"as I click these versions they take time to show in the preview — why is
it not instant?"*. It was three things at once:

1. **The tile and the preview asked for different URLs.** The tile drew
   `/posts/{id}/images/{imageId}`; the preview drew `/posts/{id}/image?v=N`. Same bytes,
   two addresses — the browser could not reuse what it had *just* downloaded to paint
   the tile.
2. **Both were served `no-store`**, so even the same URL was refetched every time.
3. **The click waited on a round trip first.** `selectPostImage` → then bump the version
   → then fetch the image. Serial, with up to 2.4 MB at the end of it.

And first paint was heavy for its own reason: the 64px tiles were **full-size** PNGs
scaled down in CSS — about 3 MB to draw five squares.

## Decisions

**The preview reads the content-addressed URL.** When the gallery knows which image is
selected, the preview renders `galleryImageUrl(postId, selectedId)` — byte-for-byte the
address the tile already used. With the backend's `immutable` header (`SPEC-190`) a
version already seen is a repaint, not a request. `postImageUrl` stays as the fallback
for when the gallery has not loaded or a fresh generate is not in it yet.

**No cache-buster on that URL, deliberately.** An image row is append-only, so a `?v=`
would only defeat the caching that makes this fast. The "current image" URL keeps its
version parameter, because what it points at genuinely changes.

**The click applies optimistically.** `pendingImageId` moves the preview the instant it
is clicked and the write happens behind it; a rejected write puts the preview back. The
UI never waits on the network to show something the browser already has.

**Tiles request a rendered thumbnail** (`?w=160`), plus `loading="lazy"` and
`decoding="async"` — the strip stops costing megabytes.

**Hover warms the full size.** `onPointerEnter` preloads the full image, so even the
*first* click on a version has nothing left to fetch. It costs nothing until the owner
shows intent, and it is skipped for the already-selected tile and the product original.

## Scope

- `services/social-actions.ts` — `galleryImageUrl` takes `width`; `GALLERY_THUMBNAIL_WIDTH`.
- `features/social/post-detail.tsx` — `pendingImageId`, the preview URL choice, optimistic
  apply with rollback, thumbnail tiles, hover prefetch; a regenerate/upload clears the
  optimistic pick since a new image supersedes it.

## Tests

`tests/gallery-urls.test.ts` pins the URL contract — no cache-buster, the width
parameter, and the property the whole fix rests on: the tile URL and the preview URL are
the same address apart from the width. It also asserts the width stays inside the set the
backend accepts, since a drift there would 422 every tile at once.

### Manual verification

- [ ] Click between versions — the preview changes with no visible delay.
- [ ] Switch back to one seen before — no network request in devtools.
- [ ] The tiles load as small images, not full-size PNGs.
- [ ] A failed switch puts the preview back rather than lying.
- [ ] Regenerating shows the new image, not the previously picked one.
- [ ] Both themes; two-column Studio unaffected.

## Acceptance Criteria

- [ ] Switching to an image already seen makes no request.
- [ ] The preview updates immediately on click, before the server confirms.
- [ ] The tile strip costs a fraction of what it did.
- [ ] A rejected switch is rolled back visibly.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Patches

### 2026-08-29 — the rail moves beside the preview, and every version is prefetched

Reported after the first pass: *"still takes time to show in the preview"*, and a request
to move the strip into the empty space right of the preview.

**Caching was necessary but not sufficient.** `immutable` makes the *second* view free;
the first still pulled a **2.2–2.4 MB** PNG out of Postgres (measured on the live
database). Backend `SPEC-190` Patches now serves a width-bounded **WebP** derivative:
2,286 KB → **38 KB** at `w=1024`, and **3.2 KB** at the tile's `w=160`. Downloads keep
the stored PNG, so nothing the owner actually posts loses quality.

**That is what makes the owner's own suggestion affordable.** He asked whether the images
could be loaded up front so a click has nothing to fetch. At 2.4 MB each that would have
been ~7 MB of prefetch; at 38 KB it is ~150 KB for the whole strip. So every version is
now warmed as soon as the gallery is known, not merely on hover — the first click on any
version is instant, not just the second. Hover-warming stays in the rail as the fallback
for anything the effect has not reached yet.

The prefetch and the preview deliberately request the **same width**: a different one
would be a different URL, miss the cache, and download again — the exact defect being
fixed. A test pins that.

**The rail moved beside the preview.** It sat under the controls, below the fold, while
the space to the preview's right stayed empty — so comparing a version against the post
it would appear in meant scrolling between the two. It is now a 4rem vertical rail in a
flex row with the preview card, extracted to `features/social/version-rail.tsx` (the
strip had grown to ~95 lines inside an already long component). In the two-column Studio
it sits inside each panel, beside that panel's own preview — never in the page's right
margin, where Instagram's versions would end up next to Facebook's post.

### Scope added

- `services/social-actions.ts` — `PREVIEW_WIDTH`.
- `features/social/version-rail.tsx` — new; the strip, vertical, with hover warming.
- `features/social/post-detail.tsx` — the flex row, the prefetch effect, the preview
  reading the derivative; the old in-controls strip removed.
