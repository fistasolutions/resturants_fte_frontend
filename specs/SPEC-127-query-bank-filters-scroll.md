# SPEC-127 — Query bank: filters + scrollable list (frontend)

Enhance the Inbound Engine's **Query bank** card (`features/spotlight/inbound-engine-tab.tsx`)
so a large, grouped query list stays usable: a **filter bar** (search + intent + source)
above a **vertically scrollable** results region. Isolated to Spotlight; tokens only;
no Framer Motion (Rule 9).

## Why
The bank can hold dozens of derived + Search-Console queries across many clusters. Today
the whole list renders inline and grows the page unboundedly, with no way to narrow it.
Merchants need to find the intent they want fast.

## Scope
- **Left card (Query bank) only.** The Drafts card is unchanged.

## Filter bar (above the scroll region, does NOT scroll away)
- **Search** — a text `Input` (Lucide `Search` icon) filtering by keyword substring
  (case-insensitive, trimmed).
- **Intent** — a shadcn `Select`: "All intents" + one option per intent actually present
  in the data (labelled via `queryIntentLabel`). No hard-coded intent list — derive from
  the queries so a new backend intent still appears.
- **Source** — a shadcn `Select`: "All sources" + one option per source present
  (labelled via `querySourceLabel`, e.g. Suggested / Search Console).
- A small count line: `N of M searches` (updates live).

## Scrollable results
- The grouped cluster list renders inside a container with a capped height
  (`max-h-[60vh]`) and `overflow-y-auto` so it scrolls independently of the page and the
  right column. Cluster headers may stick to the top of the scroll region
  (`sticky top-0`) with a `bg-card` backdrop so the topic stays visible while scrolling.
- Empty states: (a) no queries at all → existing "bank fills in once synced" message;
  (b) queries exist but none match the filters → "No searches match your filters." with a
  clear/reset affordance.

## Pure logic (unit-tested, `lib/spotlight.ts`)
- `filterQueries(queries, { search, intent, source }): SpotlightQuery[]` — pure:
  case-insensitive keyword substring; `intent`/`source` match exactly unless the sentinel
  `"all"`; preserves input order (grouping happens after, as today).
- `queryFilterOptions(queries): { intents: string[]; sources: string[] }` — the distinct
  intents/sources present, in first-seen order, for building the Select options.

## Tests (Vitest, node env)
- `filterQueries`: search substring (case-insensitive); intent/source exact + `"all"`
  passthrough; combined filters AND together; empty result when nothing matches.
- `queryFilterOptions`: distinct + first-seen order; empty input → empty arrays.
- `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green (Rules 4 & 7).

## Manual verification (no jsdom runner)
- [ ] Typing in search narrows the list; count updates.
- [ ] Intent/source selects narrow the list; combine correctly.
- [ ] List scrolls within the card; page/right column don't scroll with it; headers stick.
- [ ] "No matches" state + reset works; both light & dark; keyboard-navigable selects.

## Acceptance criteria
- [ ] Filter bar (search + intent + source + count) above a `max-h`/`overflow-y-auto`
  scroll region; sticky cluster headers.
- [ ] `filterQueries` + `queryFilterOptions` pure + unit-tested; component uses them.
- [ ] Both empty states handled; tokens only; no entrance animation; all green.
