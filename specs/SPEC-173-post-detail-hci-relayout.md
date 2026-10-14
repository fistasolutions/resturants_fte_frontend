# SPEC-173 — Post detail: HCI re-layout for the hand-run workflow

## Context / Why

The post detail is where the owner spends every working minute of Social Growth, and
in manual-first mode (backend `SPEC-184`) it is the *only* screen that matters. Reviewed
against Nielsen's heuristics and Microsoft's Guidelines for Human-AI Interaction, the
panel scores well on craft — real `aria` roles, every loading/empty/error state handled,
honest empty states, reversible actions — and poorly on **task flow**.

Six concrete problems, all visible on the running page:

1. **You cannot read the caption you are about to publish.** The right column offers
   *Edit caption · Refine · Copy caption* — three controls acting on text that appears
   only inside the small phone preview, truncated. The single most important thing on the
   screen is the least readable thing on it. (Nielsen H1 — visibility of system status.)
2. **Copy and Download are split across two sections, both mid-panel.** The two controls
   used on every single post are the two that require hunting. (Nielsen H7 — efficiency.)
3. **The page never says why this product.** It shows persona and pillar; the actual
   commerce reason — best seller, dead stock, margin, with the real number — is on the
   row in the database and absent from the screen. This is the most valuable sentence the
   product can show and the one it omits. (HAX **G11** — make clear why the system did
   what it did.)
4. **"Approve it and it auto-schedules for Aug 26, 2026"** — observed on 2026-08-28,
   promising a date two days in the past.
5. **A blank image area with no explanation** reads as broken rather than as "not
   generated yet". (HAX **G2** — make clear how well the system can do what it can do.)
6. **The preview is labelled "Sponsored"** — these are organic posts, and the preview is
   the owner's fidelity check before publishing.

**Approve is kept.** An earlier draft of this plan proposed removing it as ceremonial;
that was wrong. Approving is what auto-schedules a planned post onto the Calendar, and
the owner has explicitly kept scheduling and the Weekly Plan. Only the message changes.

**Send to phone is not in this spec.** It needs a deep link to a single post, which does
not exist yet — a separate slice.

## Scope

### Backend — `post_detail` carries the commerce reason

`SocialPost.reason` / `reason_detail` already exist on the row and are written at
generation time; the payload simply never returned them. `post_detail` gains `reason`
(`str | None`) and `reasonDetail` (`str | None`) — additive, camelCase, no new query
(the post is already loaded). Frontend `PostDetail` mirrors both.

### 1. A sticky action bar at the top of the panel

`Copy caption` and `Download` move out of the CAPTION and IMAGE sections into a bar
pinned at the top of the detail, alongside the **one contextual primary action**:

| Post status | Primary shown |
| --- | --- |
| `in_review` / `changes_requested` | **Approve** |
| `approved` / `scheduled` | **I posted it** |
| `published` | *(none — status chip + View post)* |

One primary at a time, so there is never a question of what to do next. The status chip
moves into the same bar: state and action stop living in opposite corners of the screen.

`Download` renders only when an image exists; `Copy caption` is always available.

### 2. The caption becomes the largest text in the column

A real, readable block — the full active variant plus its hashtag line — with
`Edit · Refine` beneath it. What the owner is about to publish is what the owner can
read.

### 3. The commerce reason sits under the title

`reason` + `reasonDetail` render as one grounded line beside the product name
(*"Best seller · 1,805 sold in 90 days"*), styled as fact, not decoration. This is the
answer to "why am I posting this", and it is already computed.

### 4. Honest scheduling copy

The planned-draft message becomes **"Approving schedules it for <date>"** — and when
that date is already past, **"Approving schedules it for <date> — that date has
passed, so pick a new one on the Calendar"** with the link. A promise the system cannot
keep is worse than no promise.

### 5. A readable measure

The right column is capped at `max-width: 68ch`. The hashtag row currently spans the full
~1200px viewport; a line that long is not read, it is skimmed and mis-scanned.

### 6. An explicit no-image state

Replaces the blank area with a bordered placeholder reading **"No image yet"** and the
generate action — absence stated, not implied.

### 7. Preview fidelity

`Sponsored` → the store's own handle line, matching an organic post. The preview exists
to be trusted; a wrong label costs it that.

## Performance (root Rule 5)

No new fetches — `reason`/`reasonDetail` ride the existing payload from a row already
loaded. The sticky bar is CSS `position: sticky`; no scroll listener, no measurement.

## Tests (root Rule 4)

**Vitest** — `tests/post-detail-actions.test.ts` over new pure helpers in
`lib/social-post.ts`:

- `primaryAction(status, publishReady)` — `approve` for in_review/changes_requested;
  `mark-posted` for approved/scheduled; `none` for published; **never two primaries**.
- `scheduleMessage(plannedFor, today)` — the normal sentence for a future date, the
  "that date has passed" variant for a past one, null when unplanned. **The regression
  that produced "auto-schedules for Aug 26" on Aug 28.**
- `reasonLine(reason, reasonDetail)` — formats the known signals, degrades an unknown
  token to title case, returns null when both are absent.

**Manual checklist** (no component runner):

- [ ] Caption is fully readable in the right column without opening anything.
- [ ] Copy + Download reachable without scrolling, on a short and a long post.
- [ ] Exactly one primary action visible at each status.
- [ ] A planned post whose date has passed says so and links to the Calendar.
- [ ] A post with no image shows "No image yet", not a blank area.
- [ ] The reason line shows the real number from the database.
- [ ] Preview no longer says "Sponsored".
- [ ] Hashtags wrap inside the measure instead of spanning the viewport.
- [ ] Keyboard reachable; verified in **both** themes; nothing animates in.

## Out of scope

Send to phone (needs a per-post deep link), the Weekly Plan status work (group B), and
any change to what the AI writes.

## Acceptance Criteria

- [ ] Sticky bar with Copy · Download · one contextual primary · status chip.
- [ ] Caption readable as primary text; Edit/Refine subordinate to it.
- [ ] Commerce reason visible under the title, from real data.
- [ ] No message ever promises a date that has passed.
- [ ] Explicit no-image state; no "Sponsored" on an organic preview.
- [ ] Column capped at a readable measure.
- [ ] Logic in `lib/`, Vitest-covered; `npm test` + `tsc` + `build` green.
