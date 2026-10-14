# SPEC-177 — One request for every version, and a way to throw one away

**Repo:** frontend · **Status:** implemented · **Date:** 2026-08-29
**Backend counterpart:** `SPEC-191` · **Continues:** `SPEC-176`

## Problem

After `SPEC-176` the owner reported it working, *but*: opening one version and then
another immediately still made the first one wait.

Measured against the live database, the cause was not the images:

| | image 6 | image 7 |
| --- | --- | --- |
| before (read 2.3 MB source + encode) | 3,187 ms | 1,528 ms |
| after (read 38 KB derivative) | 1,834 ms | 1,164 ms |

Shrinking the payload 60× moved the number far less than it should have, because under
it sits a **~1.2 s floor per request** that has nothing to do with images:

```
same session, repeated reads:   665ms, 265ms, 258ms, 256ms
new session per request:       1398ms, 1220ms, 1142ms
```

Warming the strip one image at a time therefore paid that fixed cost once per version,
and a click landing inside the warm-up window still waited. **My `SPEC-176` prefetch made
the symptom worse for the first image**, because six parallel requests all paid it at
once.

## Decisions

**One request, bytes held in the page** — the owner's own suggestion. `GET
…/images/preload?w=1024` returns every version as a data URL. The preview and the tiles
read from that map first and fall back to their own URLs, so a failed preload is a slower
panel, never a broken one. Affordable only because a derivative is ~38 KB: the whole
strip is ~150 KB.

This also makes switching independent of the HTTP cache. Bytes already in the page cannot
be evicted, revalidated, or raced.

**Delete is inline, not a modal.** A dialog for *"throw away a take I didn't like"* is
heavier than the decision. The trash icon becomes **"sure?"** and commits on the second
click; blurring cancels. It is irreversible, so it still asks.

**The product photo has no delete.** It lives in Shopify and is not ours to remove.

**The survivor comes from the server, not a guess.** `deleteGalleryImage` returns the new
`selectedImageId`; the panel mirrors it rather than picking one locally and risking
disagreement with the database.

## Scope

- `services/social-actions.ts` — `preloadGalleryImages`, `deleteGalleryImage`.
- `features/social/post-detail.tsx` — the batch preload replaces the per-image warm-up;
  `removeGalleryImage`; the preview prefers inline bytes.
- `features/social/version-rail.tsx` — inline bytes for tiles, the two-step delete.

## Tests

`tests/gallery-urls.test.ts` pins that the preload width matches the preview width (a
drift would make the page hold bytes it never shows while still fetching the ones it
does), and that the download URL carries no width — full quality is the point of it.

### Manual verification

- [ ] Open a post: one `preload` request, then switching versions makes **no** request.
- [ ] Open one version and immediately another — neither waits.
- [ ] Trash → "sure?" → gone; clicking away cancels.
- [ ] Deleting the live version promotes another and the preview follows.
- [ ] Deleting the last version shows the empty state, not an error.
- [ ] The product photo has no delete control.
- [ ] Both themes; two-column Studio unaffected.

## Acceptance Criteria

- [ ] Switching versions performs no network request after the initial preload.
- [ ] A failed preload degrades to the previous behaviour.
- [ ] A version can be deleted, with confirmation, and never orphans the selection.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.
