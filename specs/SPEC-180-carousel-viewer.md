# SPEC-180 — Look at the carousel you just paid for

**Repo:** frontend · **Status:** in progress · **Date:** 2026-08-29
**Fixes:** `SPEC-179` (the strip) · **Consumes:** backend `SPEC-194`

## Why this exists

`SPEC-179` shipped the slides strip and stopped one step short of the point. The
owner, looking at a finished carousel, asked *"how do I see it?"* — and the honest
answer was that he could not. Three 80-pixel thumbnails, no click target, no way
to open a slide. The Reel tile beside it has opened a player since `SPEC-174`;
the carousel offered nothing. **A feature you cannot look at is not finished**,
and the owner had to ask rather than being shown.

A second, quieter lie in the same strip: the thumbnails are square while the
slides are portrait (or landscape on Facebook), so every tile is centre-cropped.
The strip was misrepresenting what will actually post.

## Decisions

**Click a slide → the full sequence, not just that slide.** Opening slide 2 opens
a viewer positioned at slide 2, with the rest reachable. The thing being judged is
the **argument** — whether slide 3 earns the swipe from slide 2 — and that cannot
be judged one still at a time.

**Navigate the way people already expect.** Arrow buttons, `←`/`→` keys, a
`2 / 3` counter, `Escape` to close (shadcn `Dialog` gives the last one, plus focus
trapping and the overlay, for free — root Rule 9 says extend shadcn before
inventing). No swipe-gesture library: a horizontal drag on touch is nice, and not
worth a dependency in this slice.

**Render at the post's real aspect, in both places.** Instagram is 4:5, Facebook
1.91:1 — the same rule the post preview already applies. The thumbnails stop
being square and the viewer never letterboxes or crops, so what the owner judges
is what Meta will show.

**The job label travels with the slide.** "how it fits", "the detail" — the
carousel is a sequence of *arguments*, and the viewer is exactly where knowing
which argument this frame is making matters.

**No entrance animation** (root Rule 9): the dialog uses shadcn's own open
transition and nothing else moves.

## Acceptance Criteria

1. Clicking any slide opens a viewer at that slide. *(done)*
2. Arrows and `←`/`→` move through the sequence; `Escape` closes. *(done)*
3. A `n / total` counter and the slide's job label are visible. *(done)*
4. Thumbnails and the viewer both render at the post's channel aspect. *(done)*
5. Navigation stops at the ends rather than wrapping — a carousel has a first and
   a last slide, and wrapping hides which is which. *(done)*
6. `npm test`, `npx tsc --noEmit`, `npm run build` green. *(done)*

## Manual verification (no component runner — root Rule 4)

- Open a post with a finished carousel; click slide 2 → viewer opens on slide 2.
- Arrow keys walk 1 → 3; the counter tracks; the buttons disable at each end.
- On an Instagram post the frame is 4:5; on Facebook it is 1.91:1; nothing is cropped.
