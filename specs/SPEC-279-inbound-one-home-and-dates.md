# SPEC-279 — Inbound Engine: one phrase one home, every search dated

**Status:** implemented 2026-09-18 · **Backend:** SPEC-277 (`/spotlight/inbound` now carries
`added_on`/`new` per row, `angles`/`newest_on`/`new_count` per topic and the run facts in
`summary`). Approved from `ref/mockups/inbound-engine-v3.html` — built in the app's own
components and tokens, not the mockup's styling.

## What changes on the tab (SPEC-277 frontend, `features/spotlight/inbound-engine-tab.tsx`)
- **Run line under the tab header:** Bank rebuilt <date, time> · Google window <start – end>
  · Keyword Scout last added <date> · N ideas · <topics> topics · <searches> searches ·
  <angles> research angles. Each figure is the backend's; a missing one reads honestly
  ("not rebuilt yet", "Search Console not connected", "the Scout has not added anything").
- **Tiles:** Where the money is · Real demand · Written / not yet · **New since last run**
  (searches and topics added by the last nightly rebuild; says when the Scout last added).
- **Added segment** (`ADDED_WINDOWS`: Today · 7 days · 30 days · All time, default **30 days**)
  filters **rows** by `addedOn` against `summary.today`; a topic's shown counts, angles and
  rows follow the window and a topic with no row in the window leaves the list. Counts on
  the segments are searches, not topics.
- **Show segment:** "Research ideas" becomes **With research angles** (topics holding ≥ 1
  scouted row); the rest unchanged. Sort gains **Newest first** (`newestOn` desc).
- **Topic card:** name · source chip · `N new` chip · today's focus; meta line "31 searches ·
  19 research angles · persona · intent · newest Sep 18". Rows: "persona · added Sep 12 ·
  Keyword Scout" under the phrase, a `new` chip, source chip reads **Research angle** for
  scouted rows. The "+ N more" line also says how many earlier rows the window hides and
  offers "show all time" (switches the segment).
- **Write this** targets the page-two winner even when it is the synthetic Search Console
  line (`id === null` → `GenerateDraftButton keyword=`), never a page-one row.

## Pure half (`lib/inbound-topics.ts`, Vitest)
`ADDED_WINDOWS`, `rowInWindow(row, window, today)`, `applyAddedWindow(topics, window, today)`
(returns topics with windowed `rows`, `queries`, `angles`, `hiddenRows`), `addedCounts`,
`formatAddedOn`, `rowSourceLabel`, sort `newest`, `formatClicks` with thousands separators,
`topicWriteRow` returning the synthetic line. Adapters read the new fields with safe defaults.

## Files
`lib/inbound-topics.ts`, `types/spotlight.ts`, `features/spotlight/inbound-engine-tab.tsx`,
`features/spotlight/topic-card.tsx`, `tests/inbound-topics.test.ts`,
`lib/docs/content/spotlight.ts`, `tools/build_docs_screens.py` (fresh capture).

## Acceptance
1. With the live bank the tab shows real topics (categories), not one topic per scouted
   phrase; research angles sit inside their topic.
2. Every row shows its added date and source; rows since the last run wear `new`.
3. Added: 30 days hides older rows and drops empty topics; All time shows everything.
4. tsc · lint · `npm test` · `npm run build` green; registry pinned; doc + capture updated.

## Verification (2026-09-18, `tools/capture_inbound_0918.mjs` against the live app)
- 16 topic cards (was 179); run line "Bank rebuilt Sep 18, 2026, 12:00 AM · Google window
  Aug 22 – Sep 18, 2026 · Keyword Scout last added Sep 12, 2026 · 26 ideas · 15 topics ·
  445 searches · 156 research angles · plus searches for the store by name".
- Tiles: 157 searches on page two (~4,000 clicks) · 21,976 / mo across topics (42,572 / mo
  more are searches for the store by name) · 3 · 12 written/not · 0 new since last run
  (the Scout last added Sep 12).
- Added segments Today 0 · 7 days 133 · 30 days 356 · All time 440 (with the 60-row
  cap; lifted to 200 afterwards so the counts equal the bank); Today → 0 topics with
  "16 with nothing added in this window" and a Show all time button; every switch 0
  requests.
- Skirts open: 8 rows, each "persona · added Sep 17 · Search Console", 2 research-angle
  chips in the first 8, "Draft in review · Open draft"; the brand home last, with no
  action and no state pill.
- Gates: tsc clean · lint 0 errors (3 pre-existing warnings elsewhere) · `npm test`
  155 files / 1,793 passed (12 in `inbound-topics.test.ts`) · `npm run build` exit 0.
- Doc: Spotlight → Inbound Engine section rewritten; `spotlight-inbound` screen
  regenerated from `ref/screens/inbound-2026-09-18/01-inbound-topics.png`.
- Acceptance 1–4: **done**.
