# SPEC-265 — Striking distance on Daily Picks and Visibility

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
Backend counterpart: `SPEC-264-striking-distance.md` (numbered independently).
Depends on: SPEC-164 (why-did-this-rank explanation), SPEC-261 (Visibility index
column), SPEC-230 (client cache).

## Problem

The backend now scores "striking distance" — searches the store already ranks 8–25
for — as a fifth Daily Picks component, with the exact query as evidence, and serves the
store's top page-two opportunities. The UI shows four bars and a hard-coded weight
mirror; a pick lifted by "you rank #12 for 'black maxi skirt'" would look like an
arbitrary score, and the opportunities list has no home.

## What this builds

1. **Types + adapter.** `DailyPickScoreParts.striking?: number` (absent on snapshots
   frozen before measurement — never defaulted to 0, so the bar only draws when the
   backend measured it); `DailyPick.striking: PickStriking | null` (`query`,
   `position`, `impressions`, `potentialClicks`, `matchedQueries`). New
   `StrikingOpportunity` / `StrikingDistanceData` for the endpoint;
   `spotlightPaths.strikingDistance` + `spotlightQueries.strikingDistance()`,
   prefetched with Visibility.
2. **`lib/spotlight.ts`** — `DAILY_PICK_SCORE_PARTS` gains `{ key: "striking", label:
   "Striking distance" }` (rendered only when the part is present); `SCORE_WEIGHTS`
   becomes a function of whether striking is measured, mirroring the backend's two
   weight sets (legacy 0.40/0.25/0.20/0.15 · measured 0.30/0.20/0.20/0.15/0.15 —
   explanation only, never a recomputation); driver copy "you already rank on page two
   for a search here — one focused post moves it to page one", limiter copy "nothing
   you already rank for is within reach here yet". `pickRankExplanation` gets a new
   first-priority "Why now" line from the evidence: *you rank #12 for "black maxi
   skirt" — 6,522 searches saw it in 28 days; page one is one good post away.*
   `pickModifierNotes` unchanged. `formatStrikingEvidence(pick)` is the pure
   formatter, Vitest-covered.
3. **Daily Picks card.** The fifth bar when measured; under the bars, the evidence line
   with a target icon so the reason is legible without opening the explanation.
4. **Visibility tab — "Page-two opportunities" card** (`features/spotlight/
   striking-distance-card.tsx`): the top 10 from the endpoint as a table — query,
   position, impressions, clicks now, potential clicks, the cluster chip (or "no topic
   yet") — with the window date and a one-line explanation of what the number means.
   Empty state before the first snapshot ("appears after the next Search Console
   sync"). Placed above Top search queries.
5. **Docs (root Rule 11).** `lib/docs/content/spotlight.ts`: Daily Picks section names
   the fifth component and the evidence line; Visibility section names the card;
   `howItWorks` explains striking distance in one sentence; `updated` bumped.

## Not changed

The four legacy bars and their explanation when striking is unmeasured; the picks'
order (backend-owned); the index column from SPEC-261.

## Acceptance criteria

- [x] A measured pick shows a fifth bar and the evidence line; an unmeasured pick looks exactly as before.
- [x] The explanation names striking distance as driver/limiter with the measured weights only when measured.
- [x] Visibility shows the opportunities card from the endpoint, with an honest empty state.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

- [ ] Spotlight → Daily Picks after tonight's run: "skirts" shows the Striking distance
      bar and *you rank #11.7 for "black maxi skirt"*; discovered picks show no bar.
- [ ] Spotlight → Visibility: "Page-two opportunities" lists black maxi skirt at the
      top with ~600 potential clicks; light and dark.

## Patches

- **2026-09-18 — the card led with the halved rank (quick fix, with backend SPEC-164
  Patches).** The pill now reads **N fit** (`pickHeadlineScore` — `score_parts.fit`
  when the backend sent it, else the ranking score) and a separate muted pill
  "ranked lower today" appears when freshness < 1; `pickRotationNote` words the
  note as "Ranked lower today — written N days ago" (from the 0.5 → 1 over 30 days
  curve). `tests/spotlight.test.ts`, `tests/spotlight-provenance.test.ts`.
