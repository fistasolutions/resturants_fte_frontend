# SPEC-274 — Knowledge Base and Facts, redesigned: scan the list, open the page

**Repo:** frontend · **Status:** implemented 2026-09-18 · **Backend:** SPEC-273
(`GET /brand-brain/sources/{id}`, `GET /brand-brain/facts/{id}`) · **Builds on:**
SPEC-263 / SPEC-267 · **Mockup:** `ref/mockups/brand-brain-kb-facts-v2.html`
(approved; the owner then asked for the detail as a **sub-page with breadcrumbs**,
the site's pattern, instead of the side sheet)

## Why

Both tabs made the owner read instead of decide: a cramped table beside a panel of
grey blocks; a wall of fifty identical rows with the source pushed to the far edge and
no way to see what is pending, what conflicts, or what the brain gains. The owner:
"both are too bad UI — value-oriented, HCI-oriented".

## The design

**Both tabs open with the decision owed and the value of acting**, then a list you can
scan; an item opens on **its own page with breadcrumbs** (Products › Catalog › product
is the precedent), never a permanent split.

### Knowledge Base — `/spotlight/brand-brain/files`
- Four tiles: **Needs you** (N facts from M documents waiting; coverage today → if
  approved, from the coverage read's `counts`), **In the library** (items · documents ·
  notes · pages watched), **What they taught** (facts · personas · samples · rules),
  **Coverage from files** (the coverage bars; the empty section named).
- Toolbar: status segments **All · Needs review · Reading · Ready · Failed** (counts),
  type select, tag select, search, sort (Newest · Needs review first · Name · Most
  taught), **Add to Knowledge Base**.
- A **drop zone** on the page: drop a file → the Add dialog opens on the file door with
  it; *Paste text* / *Add a web page* open the other doors.
- One **card per item**: type glyph · title · meta (file · size · added · by · tags) ·
  four **stream pills** (Facts N · k to review / Personas / Voice samples / Rules ·
  switched off; zero streams dashed) · one status chip (Needs review · Reading · Ready ·
  Failed · Watched for URLs) · quick actions on hover (Download · Re-check). Click →
  the document page.
- Empty library: the drop zone alone with the founding line.

### A document — `/spotlight/brand-brain/files/[id]`
Breadcrumb *Spotlight › Brand Brain › Knowledge Base › title*. Header: glyph, title,
meta, tags, **Download · Edit name & tags · Re-check · Remove**. Stream tabs in the URL
(`?stream=facts|voice|rules|personas`): facts (pending rows with ✓/✕, a conflict as
~~old~~ → new with **Replace / Keep current**, approved rows read-only linking to the
fact page, **Approve all N**), voice samples, word/voice rules (with their switches),
personas (with Confirm). Then **History** — the item's own events.

### Facts — `/spotlight/brand-brain/facts`
- Four tiles: **Needs a decision** (pending + conflicts, *Decide now* filters), **The
  brain holds** (approved · switched off · measured), **Where they came from**
  (onboarding · files · manual · measured), **Freshness** (newest approval · oldest).
- Toolbar: segments **Everything · Needs decision · From files · Switched off ·
  Measured**, search, key legend, **Add a fact**.
- A **section rail** (sticky): each section with a coverage bar, count and a pending
  badge; click scrolls to the group. Empty sections are listed with "empty".
- **Groups** per section: header (name · count · pending · who uses it · + Add),
  collapsible. **Rows** one line: checkbox · label · **source inline** (document title ·
  locator · approved date, or Onboarding · date) · value truncated; a coloured left
  edge for pending (warning) / conflict (destructive) / off (muted); actions on hover
  and for rows that need a decision: ✓ Approve / ✕ Reject, **Replace / Keep current**
  for a conflict, Switch off / on, Delete (confirm). Click → the fact page.
- **Bulk**: select rows → a floating bar (Approve · Reject · Switch off · Delete); Esc
  clears. **Keys**: j / k move, a approve, r reject, Enter open.
- Measured facts stay read-only; Rejected stays as the last group with Restore.

### A fact — `/spotlight/brand-brain/facts/[id]`
Breadcrumb *… › Facts › label*. The fact (section, status, value — **Edit** inline
for approved rows via the SPEC-111 update; ✓/✕ for pending), **Cited from** (the
document card with locator, linking to the document page; or "Entered at onboarding"),
**Who uses it** (the writers that read this section), **History** (its events),
**Related facts** (same section).

## Data

- `lib/queries/brand-brain.ts`: `source(id)` → `SourceDetail { source, events }`,
  `fact(id)` → `FactDetail { fact, source | null, events }`; keys under `["brand-brain"]`.
- `lib/knowledge-base.ts`: `libraryStatus`, `LIBRARY_STATUS_FILTERS`, `filterByStatus`,
  `librarySummary`, `sortLibrary` gains `review` and `taught`.
- `lib/brand-brain.ts`: `FACT_FILTERS`, `filterFacts`, `factsSummary`, `sectionStats`,
  `SECTION_USERS`, `factSourceLine`, `relatedFacts`, `sourceHref`, `factHref`.
- Shells: `SpotlightShell` and `BrandBrainShell` pass `/spotlight/brand-brain/(files|facts)/<id>`
  through bare — the page owns its `<main>` and breadcrumb, like a product page.

## Files

`features/brand-brain/`: `files-view.tsx` (rewritten), `knowledge-card.tsx`,
`knowledge-drop-zone.tsx`, `source-page-view.tsx`, `source-streams.tsx`,
`facts-view.tsx` (rewritten), `facts-rail.tsx`, `fact-group.tsx`, `fact-row.tsx`,
`facts-bulk-bar.tsx`, `fact-page-view.tsx`, `brand-brain-breadcrumb.tsx`,
`event-list.tsx`; routes `app/(app)/spotlight/brand-brain/files/[id]/{page,loading}.tsx`,
`app/(app)/spotlight/brand-brain/facts/[id]/{page,loading}.tsx`; tests
`tests/knowledge-base.test.ts`, `tests/brand-brain.test.ts`, `tests/query-registries.test.ts`;
docs `lib/docs/content/spotlight.ts`.

## Acceptance criteria

1. Knowledge Base: tiles, segments and cards match the sources read; drop a file →
   dialog opens with it; a card opens the document page; the old split panel is gone.
2. Document page: breadcrumb; every stream shows only this item's rows; ✓/✕, Replace /
   Keep, Approve all work and the list refreshes; History lists its events.
3. Facts: tiles, segments, search and the rail agree with the read; a group's rows
   carry source inline; hover/pending actions work; bulk approve/reject/off/delete
   work; j/k/a/r/Enter work; a row opens the fact page.
4. Fact page: breadcrumb; Edit saves; the cited document links to its page; History
   lists its events; related facts link.
5. Sub-tab switch still loads only the section (shell nodes intact); the detail pages
   render bare under the shells with their own breadcrumb.
6. Loading skeletons for both new routes; error and empty states; light and dark.
7. Unit tests for every new pure helper; registry pinned; `tsc`, lint, `npm test`,
   `npm run build` green; Spotlight doc updated with the two new screens.

## Verification (2026-09-18)

`tools/capture_brand_brain_v3_0918.mjs` against the running app (dev servers, Railway
DB ≈ 650 ms/hop):

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Library: tiles / segments / cards from the read; drop → dialog; card → page; split panel gone | done — 4 cards, tiles "Nothing waiting · 4 items · 25 facts · 87%"; Needs review filter → 0 (all decided); the card opens `/files/5` |
| 2 | Document page: breadcrumb, own streams only, decisions, Approve all, History | done — breadcrumb *Spotlight › Brand Brain › Knowledge Base › …*; Spotlight header absent; Rules stream in the URL (`?stream=rules`, 5 switches); 4 voice samples; History = its 2 events |
| 3 | Facts: tiles, segments, search, rail, inline source, actions, bulk, keys, row → page | done — 45 rows; From files → 21; search narrows; rail jump lands on Policies; `j` focuses, `Enter` opens `/facts/1`; bulk bar "2 selected", Esc clears (fixed: Escape from a checkbox was swallowed by the typing guard) |
| 4 | Fact page: breadcrumb, Edit saves, cited link, History, related | done — Edit round-trips (value unchanged in substance); an onboarding fact shows "Entered at onboarding" (no document to link); History lists the fact's own events |
| 5 | Sub-tab switch keeps the shell; detail pages bare | done — the strip's `h2` keeps its tag across Files → Facts; detail pages render no Spotlight header |
| 6 | Skeletons, error, empty states, themes | done — `files/[id]/loading.tsx`, `facts/[id]/loading.tsx`; `QueryErrorState` + `notFound()` on 404; empty library / empty section copy; tokens only |
| 7 | Gates | done — 27 new helper tests (`knowledge-base`, `brand-brain`), registry pinned; **1764 tests / 153 files green**; tsc clean; lint 0 errors (3 pre-existing warnings); `npm run build` green with both new routes; Spotlight doc: Knowledge Base, A Knowledge Base item, Facts, A fact — four screens through `build_docs_screens.py` |

Timings (cold `goto`, dev): library 5.8–7.9 s, document page 3.7 s, facts 6.3–7.8 s —
the same order as every other Brand Brain sub-tab on this laptop against the remote DB.

## Patches

- **2026-09-18 — the bulk bar offered Approve to an approved fact.** The owner ticked
  one approved row and read "Approve · Reject" as "you must re-approve everything".
  Two changes: every row's source line now carries its state ("Onboarding · approved
  Aug 22, 2026", not just the date), and the bar is built from `bulkOptions` — Approve /
  Reject only when the selection holds undecided facts (with the count), Switch off /
  Switch on only for approved ones, Delete for all, plus a note ("already approved — the
  writers read these"). Each bulk action touches only the selected rows it applies to.
- **2026-09-18 — empty selection boxes read as "not approved".** Rows now lead with
  a state glyph — a green ✓ for approved, an amber dashed circle for pending, a red
  triangle for a conflict, a grey circle for switched off — and the selection boxes
  appear only after **Select** in the toolbar (Esc or "Done selecting" hides them).
- **2026-09-18 — Voice in the same language.** `voice-view.tsx` rebuilt: four tiles
  (Next step — add samples / derive / derived with N rules on, Samples, Rules, The
  gate), then three numbered steps — 1 Samples (each with its source inline, remove on
  hover), 2 Rules (Derive / Re-derive on the header, provenance chips incl. "from a
  document"), 3 the checker with the score as the headline. `voiceSummary` and
  `sampleSourceLine` in `lib/brand-brain.ts` (tests); the voice section prefetches the
  library for the source names. Verified live: 9 samples, 6 of 14 rules on, the sample
  copy scored 45 / 100 — sent back.
- **2026-09-18 — a voice-rule switch re-rendered the page; empty left column.** The
  switch went through `run()` → `onChanged()` → invalidate the whole `["brand-brain"]`
  family, so every read refetched and every switch went disabled. Now `toggleRule`
  patches the cached voice read in place (`setQueryData`), sends the one PATCH, reverts
  on failure, and only that row is busy — measured: one request, the tiles node kept.
  Layout rebalanced: Samples (list bounded to 22 rem) with the checker under it on the
  left, Rules (bounded, scrolls inside) on the right.
