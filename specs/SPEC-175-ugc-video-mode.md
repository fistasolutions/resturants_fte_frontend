# SPEC-175 — Choosing UGC vs b-roll, and reading the script first

**Repo:** frontend · **Status:** implemented · **Date:** 2026-08-28
**Consumes:** backend `SPEC-189` (UGC director + `mode` on `POST /social/videos`)
**Builds on:** `SPEC-174` (the Reel tile and inline player)

## Problem

`SPEC-174` gave the owner a player. `SPEC-189` gives him a second, structurally
different kind of video — a written persona speaking to camera — and the panel had no
way to ask for it, no way to know which one a running job is, and no way to read the
words before paying for the render.

## Decisions

**The mode is a choice made in the Media dialog, not a setting.** It is picked in the
one place that already exists to spend money, next to the price, before the click. The
two options are named by what they produce — **"Creator talks"** / **"Animate the
photo"** — with one line each saying what comes back (8s vertical vs 16s two-shot).
Naming them `ugc` / `broll` in the UI would make the owner learn our vocabulary to buy
our product.

**UGC defaults.** It is the format the owner asked for and the one that carries organic
social; b-roll stays one click away. The API default stays `broll` so any existing
caller is unchanged (backend `SPEC-189`) — the default differs deliberately between the
UI and the wire.

**A missing product photo warns instead of blocking.** B-roll animates the still, so
without it there is nothing to do — still blocked. UGC only uses the still as a
*reference* for the garment, so it generates either way; the panel says plainly that
without a photo *"the garment on camera will be invented rather than yours"*, which is
the actual consequence, and lets him decide.

**The script is shown while the job runs, not after.** Veo voices `script` verbatim, so
it is not a summary of the video — it is the video's words. A bad line is free to reject
before the render and costs $0.80 to discover after it. `UgcBriefCard` renders the
spoken line, the persona and any on-screen caption under the tile as soon as the
director returns, which is one poll in.

## Scope

- `types/social.ts` — `VideoMode`, `UgcBrief`; `VideoStatus` gains `mode` and `brief`.
- `services/social-actions.ts` — `startVideo(..., mode)`.
- `lib/social-media.ts` — `videoModeLabel`, `videoModeHint`, `videoReferenceWarning`,
  `UGC_CLIPS`; `videoBlockedReason`/`canGenerateVideo`/`videoCostLabel` become
  mode-aware, all defaulting to `broll` so existing callers keep their behaviour.
- `features/social/media-dialog.tsx` — the mode radiogroup; price follows the mode
  (~$0.80 vs ~$1.60).
- `features/social/ugc-brief-card.tsx` — new.
- `features/social/post-detail.tsx` — mode state, brief capture from both polls, a new
  run clears the previous brief (it no longer describes the job).

## Tests

`tests/social-media.test.ts` covers every mode rule: b-roll blocked without a still, UGC
allowed, the reference warning and its silences, per-mode pricing, and the `broll`
default for callers that pass no mode. 23 cases.

### Manual verification

- [ ] Dialog opens on "Creator talks"; both options are keyboard reachable and announce
      as radios.
- [ ] Switching mode changes the price on the button.
- [ ] With no product photo: UGC is clickable and warns; b-roll is blocked.
- [ ] The script appears under the tile about a poll after starting, before the video.
- [ ] Regenerating clears the old script rather than showing it against a new job.
- [ ] Both themes; two-column Studio (`compact`) still lays out.

## Acceptance Criteria

- [ ] The owner can choose the kind of video before spending.
- [ ] Each option is named by what it produces and priced correctly.
- [ ] A missing photo warns for UGC and blocks for b-roll.
- [ ] The spoken script is readable before the video finishes.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.
