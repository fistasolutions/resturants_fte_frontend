# SPEC-292 — Competitor gaps on the Inbound Engine and Daily Picks; "Written to beat" on a draft

Status: implemented (2026-09-22)
Depends on: backend SPEC-286 (the contract), SPEC-277/279 (Inbound topics), SPEC-155/
159 (Daily Picks provenance), SPEC-283 (Competitors tab), SPEC-121 (draft detail)

## Problem

Owner, 2026-09-22: "Are the competitors actually helping write the best article?"
Backend SPEC-286 makes them: an approved competitor's gap topics enter the query bank
as a second discovery source, and every article is written against the page-one
competitor article for its keyword. None of that is visible yet — the Inbound Engine
and Daily Picks would render a gap as "Derived", and a draft says nothing about what
it was written to beat.

## Changes

1. **A fourth source, `competitor_gap`** (`types/spotlight.ts` `TopicSource`;
   `lib/inbound-topics.ts` `topicSource`, `rowSourceLabel` → "Competitor gap";
   `lib/spotlight.ts` `pickSourceLabel` / `querySourceLabel` → "Competitor gap",
   `pickSourceTone` → the AI tint, `isResearchedPick` true — it is discovery). A gap
   row carries `sourceRef` (the competitor's domain); a topic carries `gapRefs`;
   the summary carries `competitorGaps`; a pick carries `sourceRef`.
2. **Inbound Engine.** A gap row's chip reads **"Gap · inheritco.com"**; a topic
   made only of gaps reads "Competitor gap", a topic with gaps among its searches
   shows "gap · <domain>" beside its source chip; a new filter **Competitor gaps**
   (`INBOUND_FILTERS`, `matchesInboundFilter`); the summary line names the count.
3. **Daily Picks.** A gap pick's provenance pill reads "Competitor gap · <domain>"
   with the discovery icon; its "Why now" line: *a competitor publishes on this and
   you don't — a gap on page one.*
4. **Competitors.** Each card's "They cover, you don't" block says which of its gap
   topics are in the bank (`gapsFiled` from the payload): **"3 of 7 filed as
   topics"**, the filed ones marked; the link goes to the Inbound Engine's
   Competitor gaps filter. A topic that did not land on a category the store sells
   is shown plain — the backend dropped it on purpose.
5. **Drafts — "Written to beat".** `BlogDraft.beat` (`lib/adapters.ts`
   `adaptBeat`, tolerant of absence): the detail's side panels gain **Written to
   beat** — the competitor page (domain, title, link), how many of its headings the
   plan covered, and the themes added because it missed them; absent when the draft
   has no brief (the research trace already says why, in the backend's words).
6. **Docs.** `lib/docs/content/spotlight.ts`: the Inbound Engine, Daily Picks,
   Competitors and Drafts sections describe the source, the filter, the pill and
   the panel exactly; `updated` bumped.

## Acceptance

1. `adaptInboundTopics` maps `source_ref`, `gap_refs`, `competitor_gaps`; the gap
   filter matches a gap topic and not a plain one; the labels read "Competitor gap"
   (Vitest).
2. `adaptBlogDraft` maps `beat` and tolerates its absence; a pick maps `source_ref`;
   `pickSourceLabel("competitor_gap")` and the why-now line (Vitest).
3. `adaptCompetitor` maps `gaps_filed` (Vitest).
4. Every rendering change is token-only, no entrance motion; `npm test`, `tsc`,
   lint, build green; docs updated.

## Manual verification

- [ ] `/spotlight?tab=inbound` → filter Competitor gaps → the filed topic under its
      category with "Gap · <domain>".
- [ ] `/spotlight?tab=daily-picks` → a gap pick's pill, if one ranked today.
- [ ] Brand Brain › Competitors → an approved card's "filed as topics" line.
- [ ] A draft written after SPEC-286 → Written to beat panel, or its trace line.

## Verification (2026-09-22)
- Live at 1440px (`tools/capture_competitor_gaps_0922.mjs`, reload-free backend on
  :8100, prod build on :3100): `/spotlight?tab=inbound&filter=gaps` opens on the
  filter ("Competitor gaps 1"), the Dresses topic carries **"gap · veiled.com"** beside
  its Search Console chip, the filed row reads **"Gap · veiled.com"**, and the bank's
  size line ends "· 1 from competitors' gaps"; Brand Brain › Competitors › Approved —
  Veiled's card reads **"· 1 of 10 filed as topics → on the Inbound Engine"** with the
  filed topic first and marked, Eastessence's "· none filed as topics — none match a
  category you sell"; the tile no longer promises that every gap becomes a topic.
  Daily Picks: no gap pick today (the nightly run has not scored the new row yet) —
  the label and tone are pinned by test. No page errors.
- Two defects found and fixed on the way: the filter count read "Competitor gaps NaN"
  (`inboundFilterCounts` seeded its record by hand — now from `INBOUND_FILTERS`), and
  the Added window recomputed `angles` from researched rows only and dropped `gapRefs`.
- Tests: `tests/competitor-gaps.test.ts` 9 passed; `npm test` 1859 passed; tsc clean;
  lint 0 errors (3 pre-existing warnings elsewhere); `npm run build` green. Docs:
  Spotlight prose updated (Inbound, Daily Picks, Competitors, Needs review) and the
  Inbound screen recaptured.
- "Written to beat" on a real draft awaits the first article whose keyword an approved
  competitor's *page* ranks for — today both approved sites rank only with their
  homepages, so the panel's data path is proven by the backend's stream test, not a
  live draft.
- Acceptance 1–4: **done**.
