# SPEC-161 — Inbound Engine: "Today's focus" (the query bank stops being a data dump)

**Status:** complete (verified 2026-08-25)
**Repo:** `ecommerce-fte-frontend`
**Depends on:** backend SPEC-163 (`parent_category`, real discovery lane),
backend SPEC-155 (Daily Picks), SPEC-125 (query bank + source vocabulary),
frontend SPEC-159 (pick provenance labels).

## Problem

The query bank is now **295 rows and growing** (backend SPEC-159 raised the ceilings and
added a discovery lane). The Inbound Engine renders all of them as one flat, filterable
list. Owner feedback, verbatim: *"to show all that is totally difficult… I want the
keywords, the queries that can rank today that are there only, not these 295."*

That is correct. 295 rows in one list is a database dump, not a work surface — nobody
opens it and knows what to do today.

## Design

### Why this is NOT a second dated snapshot

The obvious build is a dated query snapshot mirroring Daily Picks. **Deliberately
rejected.** Daily Picks and the query bank are not two rankings — they are the *same*
ranking at two grains: picks are topics to write, queries are the keywords underneath
them. A second dated snapshot would store the same ranking twice and create two
disagreeing answers to "what matters today", with two histories and two jobs to keep
alive.

Instead: **"Today's focus" is derived from today's picks.** One ranking, one dated
system (the existing immutable pick snapshot), two views. The two surfaces cannot
disagree, because one is computed from the other.

### 1. Today's focus section

`getInboundEngine` additionally fetches today's picks — **in the same `Promise.all`**, so
no extra wall-clock (root Rule 5) — and derives `focusClusters` from them.
`splitTodaysFocus(queries, focusClusters)` (pure, in `lib/`, unit-tested) partitions the
bank into:

- **Today's focus** — queries belonging to a cluster the backend ranked into today's
  picks, rendered first, in pick order so the priority reads top-down.
- **The full bank** — everything else, under its existing filterable grouping, with an
  honest count ("all 295 searches").

The focus section degrades to nothing when there are no picks yet (pre-first-run), and
the full bank renders exactly as it does today — so this is additive, never a
replacement.

### 2. Discovered keywords group under their real category

Backend SPEC-163 gives a discovered keyword its own `cluster` (its topic IS the keyword).
Grouped naively that yields one single-row group per discovery — noise that grows with
the bank. `groupQueriesByCluster` therefore groups by `parentCategory ?? cluster`, so
"modest workout tops for women" sits under **Tops** while keeping its own identity and
its own "Research" chip on the row.

### 3. Provenance on query rows

The query bank already labels `source` via `querySourceLabel`, where `researched` falls
through to a generic title-case. That was an undesigned side effect; `researched` now
maps explicitly to **"Research"**, matching the Daily Picks chip vocabulary (frontend
SPEC-159) so the same word means the same thing on both tabs.

## Tests

Vitest (`lib/` only — no component runner, root Rule 4):
- `splitTodaysFocus` puts focus-cluster queries first, in pick order; returns everything
  in `rest` when there are no focus clusters; never drops or duplicates a query
  (partition is total).
- `groupQueriesByCluster` groups a discovered keyword under its `parentCategory`, and
  still groups derived rows by `cluster` when there is no parent.
- `querySourceLabel("researched")` → "Research".
- Adapter carries `parentCategory`, defaulting to `null`.

Manual checklist:
- [ ] `/spotlight?tab=inbound` shows "Today's focus" above the full bank.
- [ ] A discovered keyword appears under its real category with a "Research" chip.
- [ ] Filters still apply to the full bank; counts are honest.
- [ ] Both themes.

## Acceptance criteria

- [ ] Today's relevant queries are surfaced above the 295, derived from today's picks (no second ranking).
- [ ] No extra wall-clock — the picks fetch is parallel.
- [ ] Discovered keywords group under their real category and are visibly "Research".
- [ ] Partition is total: no query lost or duplicated.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Verification (2026-08-25)

| Acceptance criterion | Result |
| --- | --- |
| Today's queries surfaced above the 295, derived from today's picks | **done** — `splitTodaysFocus`, fed by the pick snapshot; no second ranking exists |
| No extra wall-clock | **done** — the picks fetch joins the existing `Promise.all`, and `.catch(() => null)` keeps a missing snapshot from breaking the bank |
| Discovered keywords group under their real category, visibly "Research" | **done** — grouping keys on `parentCategory ?? cluster`; `querySourceLabel("researched")` → "Research" |
| Partition is total | **done** — explicitly asserted: no query lost or duplicated |
| test / tsc / lint / build green | **done** |

**Tests:** `tests/inbound-todays-focus.test.ts` — 9 new tests. Full suite:
**717 passed, 78 files, 0 failures.** `npx tsc --noEmit` clean. `npm run lint` 0 errors
(2 pre-existing `<img>` warnings, untouched). `npm run build`: compiled successfully.

**Design note:** the focus list is computed from the **full** bank, not the filtered set.
It is a priority list, not a search result — silently shrinking it when someone types in
the filter would make it untrustworthy.

### Manual checklist — still to be walked by a human

- [ ] `/spotlight?tab=inbound` shows "Today's focus" above the full bank
- [ ] A discovered keyword appears under its real category with a "Research" chip
- [ ] Filters still apply to the bank below; counts honest
- [ ] Both themes
