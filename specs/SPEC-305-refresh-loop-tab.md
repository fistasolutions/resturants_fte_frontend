# SPEC-305 — Spotlight › Published › Worth rewriting (the refresh loop)

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-25
**Backend:** SPEC-302 (`GET /spotlight/refresh`, `POST /spotlight/refresh/{draft_id}`)

## Why

Every article Spotlight publishes ends up ranking for searches nobody wrote it for.
Those are the cheapest wins on the whole platform — the page exists, it is indexed, it
is trusted, and a rewrite moves it from the bottom of page one onto the fold. Until now
the only way to see them was to read Search Console per URL by hand, so nobody did.

Backend SPEC-302 turned that into a ranked list with the evidence. This is the screen
that shows it, and the one button that acts on it.

## Where it lives

**Spotlight › Published**, as a third view beside Live and Unpublished — not a ninth
tab. The posts in question are published posts; the owner is already here when they
wonder what to do with them, and a segmented view is a state change, not a navigation
(the Daily Picks pattern, SPEC-163).

```
Live (12) | Unpublished (3) | Worth rewriting (4)
```

The count is the number of posts with something in the band, so a zero is honest and the
view still opens to explain itself.

## What it shows

A summary line — how many posts were scanned, what window, and the clicks the whole list
is worth — then one card per post, richest first:

- the title, linking to the live article;
- what it was written for (its target keyword);
- **the searches it ranks 8–20 for and was never written for**, up to three, each with
  its position, its impressions and what moving it to the fold would earn;
- **Rewrite** — one button, which starts the same background generation the refine loop
  runs and hands off to the draft screen.

Nothing here publishes. The rewrite overwrites the draft in place and returns it to
review, exactly as an owner-typed refinement does — the owner still approves and
publishes it themselves.

## Files

| File | What |
| --- | --- |
| `lib/refresh-loop.ts` | pure: the API adapters, `refreshSummary`, `missedLine`, `bandLabel` |
| `lib/unpublished.ts` | `PUBLISHED_VIEWS` gains `refresh` ("Worth rewriting") |
| `lib/queries/spotlight.ts` | `spotlightQueries.refresh()` |
| `services/spotlight-generation.ts` | `startRefreshRewrite(draftId)` — returns the same `GenerationJob` |
| `features/spotlight/refresh-view.tsx` | the view: summary + cards |
| `features/spotlight/refresh-post-card.tsx` | one post, its missed searches, the button |
| `features/spotlight/published-tab.tsx` | the third view, its count, its empty state |
| `features/spotlight/spotlight-tab-content.tsx` | reads `refresh` with the other Published queries |
| `app/(app)/spotlight/page.tsx` | prefetches it on `?tab=published` |

## Acceptance Criteria

1. Published carries a third view, **Worth rewriting**, with a live count; switching to
   it is local state, never a navigation.
2. Each card names the post, what it was written for, and up to three searches it ranks
   8–20 for with position, impressions and potential clicks — the backend's numbers,
   never recomputed here.
3. **Rewrite** starts the background generation, shows the progress toast at once, and
   navigates to that draft; a 409 ("already generating") is shown verbatim, not hidden.
4. The empty state says the scan runs Monday and what it looks for — a zero is never a
   blank panel.
5. Every figure is formatted by `utils/format`; no hardcoded colours; tokens only.
6. `lib/refresh-loop.ts` is unit-tested; `npm test` and `npm run build` are green.

## Verification

**Tests, 2026-09-25.** `tests/refresh-loop.test.ts` — 6 tests covering the adapters
(including a payload with every field missing, so no `NaN` reaches a sentence) and every
piece of wording. Full suite **1979 passed / 174 files**; `npm run build` green; `npx tsc
--noEmit` clean; `npm run lint` clean (3 pre-existing `<img>` warnings elsewhere).

`tests/unpublished.test.ts` asserted the tab had exactly two views — updated to three,
which is the point of that test: the view list is pinned on purpose.

`tests/docs.test.ts` (42) passes with the new **Published › Worth rewriting** section in
`lib/docs/content/spotlight.ts` (Rule 11), `updated` bumped to 2026-09-25.

**Type-checked into place.** Adding `refresh` to `PublishedView` made `tsc` name the one
file that had to change (`published-tab.tsx`'s counts record) — the view list has a single
definition and the compiler enforces it.

### Acceptance Criteria

1. Third view with a live count, local state only — **done** (`PUBLISHED_VIEWS`,
   `ViewTabs`, `useState` in `PublishedTab`; no navigation, no refetch).
2. Cards name the post, its keyword and up to three missed searches with position,
   impressions and potential clicks, straight from the backend — **done**
   (`RefreshPostCard`; `lib/refresh-loop.ts` formats, never recomputes).
3. **Rewrite** starts the background generation, sets the toast at once and navigates to
   the draft; a 409 renders verbatim — **done** (`startRefreshRewrite` returns the same
   `GenerationJob`; `generateDisabledReason` disables and explains rather than hiding).
4. The empty state says what the Monday scan looks for and when it looks again — **done**
   (`RefreshView`, `windowLabel`). Today the live store has no published posts, so this is
   the state the tab actually shows, and it reads as an answer rather than a blank panel.
5. Tokens only, `utils/format` everywhere, no hardcoded colour — **done**.
6. Unit tests, suite and build green — **done** (above).
