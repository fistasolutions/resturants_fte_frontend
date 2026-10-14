# SPEC-174 — Watch the Reel in the app (video tile + inline player)

**Repo:** frontend · **Status:** implemented · **Date:** 2026-08-28
**Depends on:** backend `SPEC-187` (video generation + `GET /social/posts/{id}/video`),
frontend `SPEC-173` (post-detail relayout), `SPEC-188` (image gallery strip).

## Problem

Backend `SPEC-187` generates a ~15s Reel and serves it as `video/mp4`. The panel
exposes exactly one way to see it: a **"Download video"** button. To review his own
generated Reel the owner must download an `.mp4` and open it in QuickTime — leave the
product to inspect the product's output. Asked directly ("where is the video, where do
I see that?"), the honest answer today is: nowhere.

## Decision

Add a **video tile** below the image Versions strip: a frame with a play badge, which
plays **inline** when clicked.

Two deliberate departures from the owner's first sketch, both about not lying:

1. **The video is NOT added to the "Versions · click one to use it" strip.** That strip
   means *this is what Approve publishes*. Approve publishes a **photo** — Reels use a
   different Meta container and are explicitly out of scope in backend `SPEC-187`. A
   video sitting there as a peer would promise a publish path that does not exist.
   It gets its own labelled block instead.
2. **It plays in a 9:16 frame, not in the post preview frame.** The previews are
   Instagram Portrait 4:5 and Facebook Landscape 1.91:1; a Reel is 9:16. Playing the
   video inside the photo frame would show a crop that is not what posts.

## Behaviour

| Job status | Tile |
| --- | --- |
| `none` | not rendered — nothing to show |
| `generating` | rendered, disabled, spinner + "Generating…" — so the owner sees the slot the video will fill |
| `ready` | poster frame + play badge + duration; click plays inline; `save` link below |
| `failed` | rendered, disabled, the failure reason on it |

- The poster is the post's **currently selected image** — the still the video was
  animated from — so the tile is recognisable before it plays.
- Clicking swaps the tile for a native `<video controls autoPlay>` in a 9:16 frame.
  Native controls, so scrub/volume/fullscreen/captions come free and keyboard-accessible.
- The player closes back to the tile, so the strip never grows permanently.
- `save` (download) is kept as a sub-link, matching the gallery strip's affordance —
  in manual-first mode the owner posts the Reel to Instagram by hand.
- A caption states the truth: **"Reel · post by hand — Approve sends the image."**

## Scope

- `lib/social-media.ts` — `showVideoTile`, `videoDurationLabel`, `videoTileDisabled`.
- `features/social/video-tile.tsx` — new component.
- `features/social/post-detail.tsx` — render it; the loose "Download video" button and
  the loose "Video generating" line are replaced by the tile (they said the same things
  in a worse place).

### Byte ranges — the part that makes it actually play

Building the player exposed that the mp4 could only ever be *downloaded*, never
*streamed*, along the whole path:

- **Backend** served a plain 200 with no `Accept-Ranges`. **Safari refuses to play a
  `<video>` whose source does not advertise range support**, and no browser can scrub
  one. Backend `SPEC-187` Patches records the fix: `app/api/ranges.py` +
  206/`Content-Range` on `GET /social/posts/{id}/video`.
- **The Next proxy whitelists headers in both directions** — it forwarded only
  `Accept`/`Content-Type`/`Authorization`, so a browser's `Range` never reached the
  backend, and it copied back only `content-type`/`cache-control`, so a 206's
  `Content-Range` was stripped and the partial body became undecodable. Both lists are
  extended; the change is additive (no JSON endpoint sends or sets these headers).

Without both, the tile would have shipped looking finished and silently failing on
Safari. Recorded here because "it plays" is the acceptance criterion, not "a player
element exists".

Out of scope: publishing the Reel (backend flow does not exist), a video gallery of
takes (one video per post today), thumbnails extracted from the video itself.

## Tests

Vitest (`tests/social-media.test.ts`) covers the new pure logic. No jsdom runner exists
(root Rule 4), so the component ships with the manual checklist below.

### Manual verification

- [ ] Post with no video: no tile, no empty space.
- [ ] While generating: tile present, disabled, spinner reads "Generating…".
- [ ] Failed: tile shows the reason and cannot be clicked into a broken player.
- [ ] Ready: poster is the selected image; play badge visible; duration shown.
- [ ] Click plays inline in a portrait frame; controls work; closing returns the tile.
- [ ] `save` downloads the same mp4 the player streams.
- [ ] Both themes; keyboard reachable; focus ring visible.
- [ ] Two-column Studio (`compact`) still lays out correctly.

## Acceptance Criteria

- [ ] The owner can watch a generated Reel without leaving the page.
- [ ] The video is not presented as a publishable "version" of the image.
- [ ] The player frame matches Reel aspect, not the photo preview aspect.
- [ ] `generating` and `failed` are visible states, not silence.
- [ ] Download is preserved.
- [ ] Tokens only, no entrance animation (root Rule 9).
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.
