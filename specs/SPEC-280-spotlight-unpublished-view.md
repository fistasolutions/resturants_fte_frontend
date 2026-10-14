# SPEC-280 — Spotlight › Published: a Live | Unpublished view

**Status:** implemented 2026-09-21 · **Backend:** SPEC-279 (`GET /spotlight/unpublished`,
`unpublished_at` / `unpublished_reason` on every post payload). Owner request 2026-09-21:
"In Published, create a tab for Unpublished as well — the ones we published and by some
cause we unpublished; mention all of them there."

## What changes
- The Published tab gets the same sub-view bar Daily Picks has (Picks | Drafts): **Live** ·
  **Unpublished** — local state over data already loaded, no navigation, no flash; the
  Unpublished label carries its count.
- **Live** is the existing list. Its empty state now says how many posts are unpublished
  and links to that view instead of only "No posts are live yet".
- **Unpublished** lists every `unpublished` post, newest departure first, as a card in the
  Published card's shape: image, title (→ the draft), keyword · persona, **Live from
  <published_at> to <unpublished_at>** (or "Published <date>" when the departure is
  unrecorded), a reason chip — *You unpublished it* · *Hidden in Shopify admin* · *Gone
  from Shopify* · *Before this was recorded* — what it earned while live (the same
  attribution summary), and two actions: **Publish again** (the existing publish action —
  the article is re-shown, never duplicated) and **Open draft**. An optional Search Console
  impressions hint as on the live card. Empty state: "Nothing has been unpublished."
- Publish again moves the post out of the Unpublished list optimistically and invalidates
  the `["spotlight", "published"]` query so Live picks it up.

## Pure half (`lib/unpublished.ts`, Vitest)
`unpublishedReasonLabel(reason)`, `liveSpanLabel(post)` ("Live Aug 29 – Sep 17 · 19 days" /
"Published Aug 29"), `sortUnpublished(posts)`. Adapter: `adaptPublishedPost` reads
`unpublished_at` / `unpublished_reason` (null when absent).

## Files
`types/spotlight.ts` (+ `unpublishedAt`, `unpublishedReason`), `lib/adapters.ts`,
`lib/queries/spotlight.ts` (`spotlightPaths.unpublished`, `spotlightQueries.unpublished()`),
`services/spotlight.ts`, `lib/unpublished.ts`, `features/spotlight/published-tab.tsx`,
`features/spotlight/unpublished-post-card.tsx`, `features/spotlight/spotlight-tab-content.tsx`,
`app/(app)/spotlight/page.tsx` (prefetch), `tests/unpublished.test.ts`,
`tests/query-registries.test.ts`, `lib/docs/content/spotlight.ts`.

## Acceptance
1. Live store: the Unpublished view lists all 8 posts with reason, dates and earnings;
   Live shows the count and the link.
2. Publish again on one of them makes it live (verified on the running app).
3. tsc · lint · `npm test` · `npm run build` green; registry pinned; doc updated.

## Verification (2026-09-21, `tools/capture_unpublished_0921.mjs` on the live app)
- Published tab in 3.7 s: views "Live 0 | Unpublished 8"; the Live empty state reads "No
  posts are live right now — 8 posts were live and are now unpublished — see them and
  publish again."
- Unpublished view: all 8 cards — title → draft, keyword, "Live Aug 29 – Sep 17 · 19
  days" / "Live Aug 29 · under a day", the reason chip (all "Before this was recorded",
  as backfilled), "No attributed sales while live", Open draft and Publish again.
  Switching views: zero requests.
- Publish again was **not** clicked on the live store — it re-shows an article on the
  storefront, which is the owner's call; the path is covered by the backend test
  (`test_republish_clears_when_and_why_it_left`) and the card's optimistic move +
  `["spotlight","published"]` invalidation.
- Gates: tsc clean · lint 0 errors (3 pre-existing warnings) · `npm test` 156 files /
  1,799 passed (6 in `unpublished.test.ts`, registry pinned) · `npm run build` exit 0.
- Doc: Spotlight → Published rewritten (Live | Unpublished), a Published › Unpublished
  section with its screen; `spotlight-unpublished` regenerated.
- Acceptance 1, 3: **done**; 2: **partial** — proven by test, not clicked on the live
  storefront (owner's decision).
