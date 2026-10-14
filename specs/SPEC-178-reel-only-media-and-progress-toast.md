# SPEC-178 — Media: one reel path, no prices, and progress you can watch

**Repo:** frontend · **Status:** in progress · **Date:** 2026-08-29
**Supersedes parts of:** `SPEC-175` (UGC video mode) · **Pairs with:** backend `SPEC-192`

## Why this exists

Four owner-directed changes to the "Media for this post" dialog, given live from
a screenshot on 2026-08-29. All four are the same underlying complaint: the
dialog asks the owner to make our decisions and then goes quiet.

## Decisions

**1 — "Animate the photo" is removed.** The mode picker is gone; a reel is a
person talking, full stop. The owner's words: *"I do not want this."* The b-roll
transport stays in the backend (`SPEC-187`, `mode="broll"`) so existing rows
still render and nothing is deleted that a stored video depends on — but no UI
can start one, and `videoMode` stops being state the owner sets. The two
mode-description helpers go with it.

**2 — Prices are off the buttons.** `videoCostLabel` / `imageCostLabel` are
deleted along with the dialog's "Each action below spends real money" line. The
owner knows what his own tooling costs and does not want the number on the
control every time he uses it.

**3 — The dialog closes on click, and a toast takes over.** Today the dialog
stays open showing "Generating — this takes a couple of minutes", so the owner
either sits on a modal for three minutes or closes it and loses all feedback.
Now: click → dialog closes → a fixed top-right toast reports the **real stage**,
not a spinner. The stages come from the backend's new `stage` field
(`SPEC-192`): *Writing the script… → Filming the first half — 1 of 2… → Filming
the second half — 2 of 2… → Joining the halves… → Reel ready.* On failure the
toast turns destructive and shows Google's own sentence.

**4 — The finished reel lands in the panel, not in the toast.** The toast is
transient status; the artifact belongs with the post. The existing Reel tile
(`SPEC-174`) is already the destination, so the toast's job ends when the tile
goes ready, and a ready/failed toast is dismissible.

**No new dependency.** The toast is ~40 lines of local component rather than
adding `sonner` for one surface. CSS-only, no entrance animation (root Rule 9).

## Acceptance Criteria

1. No "Animate the photo" control exists anywhere in the UI. *(done)*
2. No dollar amount appears on any media button or in the dialog copy. *(done)*
3. Clicking Generate closes the dialog and shows a top-right toast. *(done)*
4. The toast names the current backend stage and updates as it advances. *(done)*
5. A failure shows Google's reason in the toast, dismissibly. *(done)*
6. The finished reel appears in the post's Reel tile. *(done — SPEC-174 tile)*
7. `npm test`, `npx tsc --noEmit` and `npm run build` all green. *(done)*

## Manual verification (no component runner — root Rule 4)

- Open Media → only "Creator talks" is offered, no prices, no mode picker.
- Click Generate video → dialog closes, toast appears top-right.
- Watch the toast walk the stages; confirm the reel tile fills when it finishes.

## Patches

### 2026-08-29 — three owner-reported defects from the live Studio

**1. Two toasts, one corner.** The Studio renders a `PostDetail` **per draft**
(`content-studio-tab.tsx` maps `visibleDrafts`), so Instagram and Facebook are
two independent panels — and each rendered its own `fixed top-4 right-4` toast.
They landed on top of each other, and the owner watched what looked like one job
flip-flopping between *"Generation failed"* and *"Writing the script…"*: it was
two jobs, two toasts, one pixel position. Introduced by this spec.

Fixed by portalling every toast into **one shared host** appended to `document.body`
— a flex column, so any number stack instead of overlapping — and by naming the
**channel** on each toast (*Reel · Instagram*), because with two running the owner
must be able to tell which one is speaking. The jobs themselves were already
separate and stay separate: one `POST /social/videos` per `postId`, one poll per
panel, one row per post. Nothing about the requests changes.

**2. The failure was written twice, in the worst place.** Before the toast
existed the tile carried the whole error sentence; now it printed the same
paragraph under the thumbnail, in red, reflowing the column every time a job
failed. The tile keeps only its `AlertTriangle` and gains the sentence as a
hover/`aria-label` — the toast is where a failure is *read*.

**3. "Request changes" is deleted.** It set the post to `changes_requested` — a
two-person review handoff in a product with one person, who is both the reviewer
and the fixer. **Refine** is the control that actually changes a draft. Removed
with its service call (`requestChangesSocialPost`) and its `canRequestChanges`
flags rather than left as dead surface (root Rule 6).

**Not fixed here — Veo still needs a paid API tier.** Unchanged from `SPEC-192`:
`429 RESOURCE_EXHAUSTED`. A consumer Gemini/Google One subscription does not
apply to an API key; that project needs its own billing.
