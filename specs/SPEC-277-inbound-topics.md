# SPEC-277 — Inbound Engine as topics: where the money is, then one action per topic

**Repo:** frontend · **Status:** implemented 2026-09-18 · **Backend:** SPEC-275
(`GET /spotlight/inbound`) · **Replaces:** the SPEC-125/162 flat query list on the
Inbound tab · **Mockup:** `ref/mockups/inbound-engine-v2.html` (approved: "go")

## Why

455 searches in a flat list, each with a "Generate draft", said nothing about which
one earns a post. The owner: "so unrealistic — give it a value-oriented UI".

## The design

- **Four tiles**: *Where the money is* (page-two searches and the clicks a page-one
  move adds, the top query, a button that filters to them) · *Real demand in the bank*
  (monthly searches Google reported, how many rows are derived/research) · *Written ·
  not yet* · *Today's focus* (topics behind today's picks).
- **Filters**: segments **All topics · Page two · Google demand · Not written ·
  Research ideas** (counts), intent select, persona select, search over topics and
  phrases, sort (**By opportunity** · By demand · By name · Not written first), and
  the Keyword Scout button where it was.
- **Topic cards** (one per cluster): name + source chip + queries · persona · intent;
  four stats — **searches / mo · best rank · clicks to win · state** (Not written ·
  Draft in review · Published · date); one action — **Write this** (the existing
  generate flow on the topic's best query), **Open draft**, or **See reach**. Click
  the header to open the topic's searches: keyword · persona · volume · rank (page 1
  / page 2 / not ranking) · clicks if page 1 · intent/source chips; the first 8, then
  *show all N*.
- Focus topics carry a ✦ mark and sort first within equal opportunity.
- Intent templates stay under Advanced at the bottom (unchanged).

## Data
`lib/queries/spotlight.ts` `inboundTopics()` → `InboundTopicsData` (adapter in
`lib/inbound-topics.ts`, pure helpers: `INBOUND_FILTERS`, `filterTopics`, `sortTopics`,
`topicState`, `rankLabel`, `formatClicks`, `topicPersonas`). The old
`inboundEngine()` registry entry is removed with its loader (`splitTodaysFocus` and
the labels stay in `lib/spotlight.ts` for the picks).

## Files
`features/spotlight/inbound-engine-tab.tsx` (rewritten), `features/spotlight/topic-card.tsx`,
`lib/inbound-topics.ts`, `types/spotlight.ts` (+ `InboundTopic*`), `lib/queries/spotlight.ts`,
`tests/inbound-topics.test.ts`, `tests/query-registries.test.ts`, `lib/docs/content/spotlight.ts`.

## Acceptance criteria
1. Tiles, segments and cards agree with `GET /spotlight/inbound`; the page-two button
   filters; each segment narrows without a request.
2. A topic opens to its searches with volume, rank and clicks; "show all" reveals the rest.
3. Write this starts a generation on the topic's best query (the toast appears); Open
   draft / See reach navigate.
4. Skeleton, error, empty (no bank yet) states; Keyword Scout and Advanced unchanged.
5. Unit tests for the helpers; registry pinned; tsc, lint, `npm test`, build green; the
   Spotlight doc's Inbound section rewritten with a fresh capture.
