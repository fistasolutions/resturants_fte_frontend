# SPEC-179 — "Make this a carousel", in the same Media dialog

**Repo:** frontend · **Status:** in progress · **Date:** 2026-08-29
**Consumes:** backend `SPEC-194` · **Extends:** `SPEC-178` (media dialog + toast)

## Why this exists

Owner-directed, 2026-08-29: a third thing the post can produce, alongside the
image and the reel — *"add one more option, create the carousel"* — in the same
Media dialog, built **from the image already approved** rather than as a separate
kind of post.

## Decisions

**A third block, not a fourth mode picker.** Image / Video / Carousel sit as
three sections in the one dialog. We deleted a mode picker in `SPEC-178` and are
not reintroducing one: the button says what it makes — **"Make this a carousel"**.

**It is disabled without an image, with the reason ON the control.** The
carousel is edited from the approved image (backend `SPEC-194`), so with nothing
to build from the button says *"Generate the image first"* rather than failing on
click — the same rule the reel used to have and the same treatment.

**Slides are their own strip, below the Reel, never in the Versions rail.**
Versions mean "pick one — this is what Approve publishes"; slides are all live,
in order. Putting them in that rail would destroy its meaning. The strip numbers
each slide and prints the job the director gave it ("how it fits", "the fabric"),
so the owner reads the *argument*, not just pictures.

**Reuses the SPEC-178 toast.** The carousel reports the same `stage` shape the
reel does ("Slide 2 of 3…"), so progress needs no new surface — one more toast
in the shared stack, labelled *Carousel · Instagram*.

**A slide can be deleted; the gap closes.** Positions are the publish order, so
the backend renumbers and the strip re-renders. There is no reorder control in
this slice — deleting covers the real case ("that one's wrong") and dragging is
a bigger surface than it earns today.

## Acceptance Criteria

1. The Media dialog offers "Make this a carousel", disabled with a reason when
   the post has no image. *(done)*
2. Clicking it closes the dialog and shows a progress toast naming the step. *(done)*
3. Finished slides render in order, numbered, with their job labels. *(done)*
4. A slide can be deleted and the remaining slides renumber. *(done)*
5. The Versions rail and the Reel tile are unchanged. *(done)*
6. `npm test`, `npx tsc --noEmit`, `npm run build` green. *(done)*

## Manual verification (no component runner — root Rule 4)

- Media → "Make this a carousel" is greyed with a reason on a post with no image.
- On a post with an image: click → dialog closes → toast walks *Planning the
  sequence… → Slide 2 of 3… → Carousel ready.*
- Slides appear under the Reel, numbered 1..N with job labels; delete the middle
  one and confirm the rest renumber.
