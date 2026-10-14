# SPEC-172 — Publish controls, live performance, and the Coming Soon roadmap

## Context / Why

The frontend half of Milestones 3–6. The backend can now publish (`SPEC-180`), publish on
schedule (`SPEC-181`), measure (`SPEC-182`), and plan a week unattended (`SPEC-183`) —
none of which is reachable or visible from the UI. This closes that, and puts the
deliberately-deferred surface on the wall so the roadmap is honest rather than absent.

Three pieces, one spec because they share the same payload changes.

## Scope

### Types — `types/social.ts`

`PostDetail` and the calendar post gain (additive, camelCase, no rename):

```ts
externalPostId: string | null;   // the live IG media / FB post id — proof it went out
publishError: string | null;     // the last failure, so a stuck post explains itself
scheduledAt: string | null;      // the exact publish moment, when one was chosen
```

`PerformanceData` gains `engagement: SocialEngagement` — `measuredPosts`, `totals`
(every metric `number | null`), and `topPosts`.

**Every metric is `number | null`, and that nullability is load-bearing.** The backend
stores `NULL` when Meta didn't report a metric, because "we don't know" and "it got none"
are different facts (SPEC-182). Typing these as `number` would erase that distinction the
moment someone writes `?? 0`.

### 1. Publish controls — `features/social/post-detail.tsx`

- **Publish now** — a primary button beside Mark-as-posted, shown only when
  `canPublishNow(status, hasImage)` is true (approved/scheduled **and** an image exists,
  mirroring the backend's guards so a control is never offered for a 409).
- A pending state ("Publishing…"), because Instagram's container poll can take ~10s and a
  silent 10-second button is indistinguishable from a broken one.
- On success the chip flips to **Published** with the live "View post" link.
- On failure the backend's message renders as `role="alert"` — including the actionable
  ones (`BACKEND_PUBLIC_URL` unset, Meta not connected, no Instagram linked).
- **`publishError` renders whenever present**, not only right after an attempt: a post
  that failed at 3am on the scheduler must explain itself when the owner next opens it.
- **Publishing** status is added to `STATUS_META` so an in-flight post reads
  "Publishing…" rather than falling through `titleCase`.

### 2. Schedule with a time — `features/social/schedule-popover.tsx`

An optional time input alongside the date, sent as `time: "HH:MM"` (UTC). Omitting it
keeps today's behaviour exactly. The popover shows the resolved moment so the owner is
never guessing which timezone applies.

### 3. Live performance — `features/social/performance-tab.tsx`

`ReachSection`'s connected branch stops being a placeholder:

- A metric row — reach, impressions, likes, comments, saves, shares — where a `null`
  renders as **"—" with a "not reported" title**, never `0`.
- A top-posts table ranked by reach, each row linking to the live post.
- Connected but nothing measured yet is its own state ("posts published today will report
  tomorrow") — distinct from both "not connected" and "measured zero".

### 4. Coming Soon — `features/social/coming-soon-tiles.tsx`

A visible, non-interactive section in the Social area listing what is deliberately not
built, each with one honest line of *why*:

| Tile | Line |
| --- | --- |
| Carousels | Highest-save format; needs a coherent multi-frame set, not one image |
| Reels / video | ~2.25× the reach of a static post — the biggest remaining prize |
| Stories | Cheap to add, but they vanish in 24h and don't compound |
| TikTok | Separate platform, separate approval; worth it once Meta is proven |
| Pinterest | Long-lived for fashion, smaller reach |
| AI learns from performance | Needs months of the data now being collected |

Rendered as disabled cards with a "Coming soon" badge — the roadmap should be legible to
the owner without implying anything is half-built. No links, nothing clickable.

## Performance (root Rule 5)

No new page-load fetches: `engagement` rides the existing performance payload. Publish is
user-initiated. After a publish only local state updates — the detail is not re-fetched.

## Tests (root Rule 4)

**Vitest** — `tests/social-publish.test.ts` over `lib/social-publish.ts`:

- `canPublishNow` — true for approved/scheduled **with** an image; false for `in_review`,
  `published`, `publishing`, and for any status **without** an image.
- `publishButtonLabel` — idle / pending / retry-after-failure wording.
- `metricLabel` — `null` → `"—"`, `0` → `"0"`. **The test that stops a future `?? 0`.**
- `engagementRows` — ordered rows, nulls preserved, no fabricated zeros.
- `scheduleTimeError` — accepts `"19:30"`, rejects `"25:00"` / `"7pm"` / `""`.

**Manual checklist** (no component runner):

- [ ] Publish on an approved post with an image → live post + working link.
- [ ] Button hidden on an `in_review` post and on one with no image.
- [ ] Pending state visible for the whole container poll.
- [ ] A failed publish shows the backend's message, and still shows it after a reload.
- [ ] Scheduling with a time shows the resolved moment; without one still works.
- [ ] Performance shows "—" for unreported metrics, never 0.
- [ ] Coming Soon tiles are visible and not clickable.
- [ ] Keyboard reachable; verified in **both** themes; nothing animates in.

## Acceptance Criteria

- [ ] Publish now works from the post detail, gated exactly as the backend gates it.
- [ ] `publishError` is visible whenever set, not only after an attempt.
- [ ] Scheduling accepts an optional time.
- [ ] Performance renders real engagement; unknown metrics show "—", never 0.
- [ ] Coming Soon tiles visible, badged, inert.
- [ ] Logic in `lib/social-publish.ts`, Vitest-covered; components presentational.
- [ ] Tokens only, no brand red, no entrance animation; `npm test` + build green.
