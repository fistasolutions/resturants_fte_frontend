# SPEC-165 — Blog draft reading experience: hero height, FAQ, details panel, slug URLs, links

**Status:** complete (verified 2026-08-25)
**Repo:** `ecommerce-fte-frontend`
**Depends on:** SPEC-124 (rich blog), SPEC-122 (hero image), backend SPEC-167 (slug lookup).

## Problems (all from owner review of a live draft)

### 1. The generated hero swallows the page

`blog-hero.tsx` gives the generated-hero branch `aspect-[3/2]` **with no maximum height**.
The image is produced at exactly 1536×1024, so the ratio is correct — but on a 1600px-wide
container 3:2 means ~1067px tall, well past the viewport, and the reader lands on nothing
but photo. Both sibling branches in the same file already cap their height; this one was
missed.

Worth stating because the instinct is to blame generation: **regenerating cannot fix
this.** The asset is already the right shape; the container simply has no ceiling.

### 2. The FAQ is not an accordion

It uses native `<details>`/`<summary>`. That was a deliberate no-dependency choice, but it
gives no open/close animation and lets every panel sit open at once, so the block sprawls.

### 3. The details panel slides in from the side

`Sheet` with the default side placement. The owner wants it to come down from the top.

### 4. Drafts are addressed by database id

`/spotlight/draft/15` — an internal id in a user-facing URL.

### 5. In-body product links read as plain bold text

They already use `text-primary`. The issue is what primary *is*:
`--primary: #1a1b18` (brand ink). A "primary-coloured" link is near-black, so it does not
read as a link at all.

## Design

### 1. Cap the hero

The generated branch keeps `aspect-[3/2]` and gains `max-h-[70vh]` with
`object-cover`, so the image holds its shape, fills the frame, and can never exceed most
of the viewport. Consistent with the sibling branches, which already cap.

### 2. Real accordion, one open at a time

`blog-faq.tsx` becomes a client component with a single `openIndex` state — opening one
closes the other. The body animates via a `grid-template-rows: 0fr → 1fr` transition,
which animates to *content height* without hardcoding a pixel value and without
JavaScript measurement. 200ms, inside the allowance in root Rule 9 (this is
expand/collapse on interaction, not an entrance animation).

Accessibility is not lost by leaving `<details>`: buttons carry `aria-expanded`,
`aria-controls`, and the panel is a labelled region.

### 3. Details panel drops from the top

`SheetContent side="top"` with a max height and internal scroll, so a long panel is
usable on a laptop.

### 4. Slug URLs

The route segment becomes `[slug]` and links use `draft.handle`. Backend SPEC-167 resolves
id **or** handle from one endpoint, so **existing `/draft/15` links keep working** rather
than 404ing — the point is a nicer URL, not broken bookmarks. A draft with no handle
(older rows) falls back to its id automatically.

### 5. Links get a visible treatment — without touching brand red

Root Rule 9 reserves `--brand` (#E42828) for identity only; using it for links would
collide with `--destructive`. So links stay `--primary` and instead gain a
`decoration-primary/40 underline-offset-4` treatment that thickens on hover, making them
unmistakably links while staying inside the design system.

**Flagged for the owner:** if the intent is genuinely a coloured link, that is an
amendment to Design.md §5.1 and their decision to make — not something to slip in here.

## Tests

Vitest (`lib/` only):
- `draftHref(draft)` — returns `/spotlight/draft/{handle}` when a handle exists, falls
  back to the id when it does not, and never yields a trailing slash or `undefined`.

Manual checklist:
- [ ] Hero fills the frame but never exceeds ~70% of the viewport, at 1280/1600/2560 wide.
- [ ] FAQ: opening one closes the other; both animate; keyboard + screen reader work.
- [ ] Details panel drops from the top and scrolls internally when long.
- [ ] `/spotlight/draft/{slug}` loads; an old `/draft/15` link still loads.
- [ ] Body links are visibly links in both themes.

## Acceptance criteria

- [ ] Hero cannot exceed its cap at any width.
- [ ] FAQ is single-open and animated.
- [ ] Details panel enters from the top.
- [ ] Draft URLs use the slug; id URLs still resolve.
- [ ] Links are visibly links, `--brand` untouched.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Verification (2026-08-25)

| Acceptance criterion | Result |
| --- | --- |
| Hero cannot exceed its cap at any width | **done** — `aspect-[3/2] max-h-[70vh]`; shape kept, height bounded |
| FAQ single-open and animated | **done** — `openIndex` state, `grid-rows 0fr→1fr` 200ms |
| Details panel enters from the top | **done** — `SheetContent side="top"`, `max-h-[85vh]`, internal scroll |
| Draft URLs use the slug; id URLs still resolve | **done** — route is `[slug]`, links use `draftHref`, backend resolves both |
| Links visibly links, `--brand` untouched | **done** — thickening `decoration-primary` underline |
| test / tsc / lint / build green | **done** — 746 passed, tsc clean, 0 lint errors, build compiled |

### Notes

- **The hero was not a generation problem.** The asset is produced at exactly 1536×1024
  and the CSS asked for exactly 3:2 — the ratio was already correct. The branch simply had
  no ceiling, which both sibling branches already had. Regenerating would have changed
  nothing.
- **Leaving `<details>` meant rebuilding the accessibility deliberately** — `aria-expanded`,
  `aria-controls`, and a labelled `region` per panel. The animation uses
  `grid-template-rows` rather than a `max-height` guess so a long answer is never clipped.
- **Link colour deferred, not decided.** Root Rule 9 reserves `--brand` for identity, and
  `--primary` is brand ink (#1a1b18) — so the affordance comes from the underline. If the
  owner wants an actually-coloured link that is an amendment to Design.md §5.1 and their
  call to make.

### Manual checklist — for a human

- [ ] Hero at 1280 / 1600 / 2560 wide
- [ ] FAQ: one open at a time, animated, keyboard works
- [ ] Details panel drops from the top
- [ ] `/spotlight/draft/{slug}` loads; an old `/draft/15` link still loads
- [ ] Both themes

## Patches

### 2026-08-25 — the details panel covered the whole screen, and ids were still showing

**1. `Sheet side="top"` is `inset-x-0`.** Moving the panel to the top made it full-bleed —
it covered the entire page edge to edge, which is worse than the side panel it replaced.
The owner wanted it to drop from under the header, on the right, bounded.

A Sheet is the wrong primitive for that: it is an edge-anchored overlay by definition.
Replaced with a `Popover` anchored to the Details button — `align="end"`, `sideOffset`,
`w-[min(26rem,calc(100vw-2rem))]`, `max-h-[70vh]` with internal scroll. It now drops from
directly beneath the trigger, stays on the right where the button is, and is bounded in
both axes.

**2. The URL still showed `/draft/15`.** Pointing individual links at the slug was not
enough — a bookmark, the post-generation `router.replace`, and a Daily Picks link that
only knows the id all still land on an id URL.

Fixed at the destination instead of the call sites: the page **canonicalizes**, redirecting
to `/spotlight/draft/{handle}` whenever it was reached by another ref. Every entry point
normalizes, and old links still work — they just do not stay.

This is what surfaced the duplicate-handle bug (backend SPEC-167 Patch): redirecting to a
non-unique slug would have sent the reader to the wrong draft. Fixed there before this
redirect could ship.

### 2026-08-25 (2) — the panel needed to be a right-side drop-down, not a floating box

The first attempt made it full-bleed (`Sheet side="top"` is `inset-x-0`); the second
over-corrected into a small floating `Popover`. Neither is what was asked for. The
reference is a site mega-menu: it **drops down from under the header** and occupies the
**right-hand column**, full height, not the whole screen.

Rebuilt on `Sheet side="top"` — that side already carries the slide-down animation — then
re-anchored to the right edge:

```
data-[side=top]:inset-x-auto  data-[side=top]:right-0
data-[side=top]:top-14        data-[side=top]:h-[calc(100dvh-3.5rem)]
w-[min(28rem,100vw)]          border-l border-b-0
```

**The overrides must carry the same `data-[side=top]:` prefix as the base classes.** A
bare `right-0` does not beat a variant-prefixed `data-[side=top]:inset-x-0` — tailwind-merge
treats them as different groups, so the base wins and the panel goes full-bleed again.
That is precisely the failure of the first attempt; matching the prefix is what actually
fixes it, not adding more positioning classes.

`top-14` (56px) matches the sticky toolbar's height (`py-3` + an `h-8` button), keeping
the offset on the 8px scale rather than an arbitrary 57px (root Rule 9).

Re-verified: 746 tests passing, tsc clean, 0 lint errors, build compiled.

### 2026-08-25 (3) — it was still a modal; a mega-menu does not dim the page

Right position, right shape, wrong behaviour. The panel dimmed the entire page behind it
— article, toolbar and sidebar all greyed out — which reads as *"stop what you are doing
and deal with this"*. The reference mega-menu dims nothing: the page behind stays lit and
usable, because it is a **menu**, not a modal.

Two changes:

- `SheetContent` gains `showOverlay` (default **true**, so every other sheet in the app —
  chat, sidebar, compose history, plan drawer — keeps its modal behaviour untouched). The
  details panel passes `false`.
- `Sheet modal={false}`, so Radix stops locking scroll and blocking pointer events. The
  page behind stays scrollable and clickable.

Escape and click-outside still dismiss, so nothing is lost by removing the dimming — the
panel simply stops pretending to block you. A `shadow-xl` now carries the separation that
the scrim was doing.

Re-verified: 746 tests passing, tsc clean, 0 lint errors, build compiled.

### 2026-08-25 (4) — widen to a real right-hand column

28rem (448px) was a strip, not the right side — about 23% of a 1920px screen, so the
article still dominated and the panel read as an afterthought.

Now `sm:w-[min(40rem,40vw)]`: 640px on a normal desktop (a third of the screen), capped at
40vw so it stays a *column* on an ultrawide rather than growing into half the display, and
`w-full` below `sm` where a 40rem panel simply would not fit. Full height under the
toolbar, unchanged.

Re-verified: 746 tests passing, tsc clean, 0 lint errors, build compiled.

### 2026-08-25 (5) — the panel overlapped the toolbar once it grew a second row

Generating a header adds a status line ("Designing your header — this takes around 30
seconds…") under the button row, so the toolbar becomes taller. The panel was pinned at a
hardcoded `top-14` (56px) and ended up **above the toolbar's bottom border**, overlapping
it.

`top-14` was only ever correct for one state of a variable-height element. It would have
broken again the first time the controls wrapped on a narrow window, which is a matter of
time rather than an edge case.

Now measured: a `ResizeObserver` on the sticky toolbar feeds `toolbarHeight`, and the
panel takes `top` and `height` from it inline. It tracks the toolbar through the status
line appearing and disappearing, through wrapping, and through any future row — instead
of encoding one snapshot of the layout as a constant.

Re-verified: 746 tests passing, tsc clean, 0 lint errors, build compiled.

### 2026-08-25 (6) — the height cap shrank the hero's WIDTH

Capping the hero with `aspect-[3/2] max-h-[70vh]` fixed the height and broke the width: it
rendered as a small left-aligned block with empty space beside it.

With only an aspect ratio and a max-height, the element's width is `auto`, so the browser
derives the width from the **clamped** height — the box narrows instead of cropping. Adding
`w-full` makes the width definite, so the ratio drives height only and the cap crops via
the background's `bg-cover`.

The lesson generalises: `aspect-ratio` + `max-height` without a definite width shrinks both
axes, which is almost never what a cap is meant to do.

Re-verified: 746 tests passing, tsc clean, 0 lint errors, build compiled.

### 2026-08-25 (7) — the crop was cutting the subject, and the prompt described a different crop

Two halves of one problem.

**The CSS and the hero prompt disagreed.** `HERO_EDIT_PROMPT` already tells the model the
banner "crops the top and bottom", to keep the subject in "the middle 55–60%", and to
assume "a ~2.4:1 letterbox". But the CSS was `aspect-[3/2]` — the asset's own ratio — so
before this spec it cropped **nothing**, and after the `70vh` cap it cropped at a ratio
that changed with the viewport. The prompt was reserving margins for a crop the display
never actually performed, and then for one it could not predict.

**A `vh` cap makes the crop ratio unstateable.** At 70vh the effective ratio depends on
window width and height, so no fixed percentage in the prompt can be correct — which is
why the subject survived at some sizes and was decapitated at others.

Fixed by making the crop **constant and naming it in both places**:

- CSS: `aspect-[2/1] max-h-[720px] w-full` — always 2:1, whatever the viewport.
- Prompt (both the edit and generate variants): "middle **70%**", "nothing important in
  the top ~14% or bottom ~14%", "the final visible crop is a wide **2:1** letterbox".

About 75% of the image height now survives, against ~64% before — a materially gentler
crop, and the model is reserving margins for the crop that actually happens.

**Why not generate at the display ratio?** `gpt-image-1`'s widest landscape is
`1536x1024` (3:2), so a 2:1 asset cannot be produced. Cropping is unavoidable; the fix is
to make it predictable and tell the model about it. A comment on `_IMAGE_SIZE` now says
so, and says the prompt percentages must move if the CSS ratio ever does.

Re-verified: frontend 757 passing, backend hero suite 18 passing, tsc clean, 0 lint errors,
build compiled.

### 2026-08-25 (8) — custom scrollbar on the details panel

The panel was showing the browser's default scrollbar — a heavy grey bar against a light
card, which is the one piece of chrome the rest of the app already styles.

`scrollbar-subtle` already exists in `globals.css` (6px, `--border` thumb, transparent
track, `--muted-foreground` on hover) and is used across chat, social, inventory and the
Spotlight drafts card. Applied it here rather than writing a second treatment — a
one-off would be a new visual language for no reason.

Re-verified: 765 tests passing, tsc clean, 0 lint errors, build compiled.
