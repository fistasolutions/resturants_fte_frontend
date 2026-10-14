# SPEC-261 — Visibility: Google's index status per post

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
Backend counterpart: `SPEC-261-gsc-index-status.md` (same number by coincidence — the
repos number independently).
Depends on: SPEC-017 (Visibility tab on the live backend), SPEC-250 (property picker —
the connect flow that now lands real rows).

## Problem

The first real Search Console pull landed and the Visibility tab showed four published
posts at zero impressions with nothing to say about it. The KPI tile even read "Indexed
posts: 4" — it counted posts with *rows*, and every row was zero — while Google's own
answer was "two indexed, one discovered-not-indexed, one unknown". A zero means one of
three different things, each with a different next step, and the tab showed one
number for all of them.

## What this builds

1. **Types + adapter.** `PostReach.index: PostIndexStatus | null` — `state`
   (`indexed | discovered | crawled | unknown | excluded | error`), `coverageState`
   (Google's wording, shown verbatim), `verdict`, `lastCrawlTime`, `googleCanonical`,
   `referringUrls`, `inspectedAt`; `VisibilityData.indexSummary` `{indexed,
   notIndexed, uninspected}` from the backend (never recomputed here).
   `VisibilityTotals.indexed` — the "posts with rows" count — is renamed
   `measured` so no tile can call it "indexed" again.
2. **`lib/index-status.ts`** — the pure half, Vitest-covered: `indexBadge(index)` →
   `{label, tone}` ("Indexed" / success, "Discovered, not indexed" / warning,
   "Crawled, not indexed" / warning, "Unknown to Google" / muted, "Excluded" /
   destructive, "Fetch error" / destructive, "Not inspected yet" / muted);
   `indexHint(index)` — the one-line next step per state, in the owner's words
   (discovered → "Google knows the URL but hasn't crawled it. A link from a page Google
   already crawls — the Journal menu, the homepage — is what moves it."; unknown →
   "Google has never seen this URL. It is in the sitemap; a link from a crawled page
   is what gets it found."; indexed → "Can appear in results. Impressions arrive as it
   ranks — typically weeks for a new post."; …); `inspectInSearchConsoleUrl(property,
   url)` — the deep link to Search Console's URL Inspection for that page
   (`https://search.google.com/search-console/inspect?resource_id=…&id=…`), where
   "Request indexing" lives (Google exposes no API for it); `indexSummaryLine(summary)`
   ("2 of 4 posts indexed by Google · 2 not indexed").
3. **The tab.** The KPI tile becomes **"Indexed by Google"** with `2 of 4`. The posts
   table becomes **"Published posts"** with an **Index** column: the badge, and beneath
   it the last crawl date when Google has one. A post that is not indexed gets an
   "Inspect ↗" link to Search Console on its row. Above the table, when any post is
   not indexed, a callout says how many and carries the hint for the worst state
   present; when every post is indexed but reach is zero, the callout says the honest
   thing — indexed, not ranking yet. The `AwaitingData` empty state is only for a
   store with no rows at all; a store with zero-impression rows now sees the table
   and the index column, which is the whole point.
4. **Docs (root Rule 11).** `lib/docs/content/spotlight.ts`: the Visibility section
   describes the Index column and the callout; `howItWorks` names the URL Inspection
   step; `updated` bumped. The capture predates the column and the doc says so.

## Not changed

Reach numbers and their roll-ups; the connect prompt; top queries.

## Acceptance criteria

- [x] Each post row shows Google's index state with Google's wording, and the last crawl date when known.
- [x] The KPI reads "Indexed by Google · n of m" from the backend summary — never from row counts.
- [x] Un-indexed posts get a Search Console inspect link and a plain-words next step.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

- [ ] Spotlight → Visibility on the live store: 4 posts, "2 of 4" tile, two Indexed
      badges with crawl dates, one "Discovered, not indexed", one "Unknown to Google",
      the callout with the discovered/unknown hint, Inspect links open Search Console
      on the right URL. Light and dark.
