# SPEC-116 — Store Traffic nudge outcome on Results (Phase C frontend)

## Context / Why

Backend SPEC-115 adds a `store_traffic` array to `GET /results` (did each staffing
nudge move the store's conversion). This surfaces it as a **"Store Traffic"** tab on
the Results page, reusing the generic outcome row + verdict badge (SPEC-063 frontend).

## Scope
- **Types** (`types/results.ts`): add `storeTraffic: OutcomeEntry[]` to `ResultsData`;
  add `{ type: "traffic" }` to the `OutcomeLink` union.
- **Adapter** (`lib/adapters.ts`): add `store_traffic: ApiOutcomeEntry[]` to `ApiResults`
  and `storeTraffic: adaptOutcomeEntries(raw.store_traffic)` to `adaptResults`.
- **Results tabs** (`features/results/results-tabs.tsx`): add `{ key: "storeTraffic",
  label: "Store Traffic" }` to `TABS`; add `case "traffic": return "/traffic";` to
  `resolveLink` (the exhaustive switch — tsc enforces it).

No component/badge/empty-state change — all generic. Verdict badges reuse
worked/early/none.

## Tests (Rule 4)
No new pure logic (adapter line is trivial mapping); covered by existing adapter/results
tests + `tsc` exhaustiveness. `npm run lint`, `npx tsc --noEmit`, `npm test`,
`npm run build` all green.

## Manual verification checklist
- [ ] Results page shows a "Store Traffic" tab; nudged stores appear with ✓/→/✗ verdicts.
- [ ] "View details →" goes to `/traffic`.
- [ ] Empty state when no nudges sent; light + dark; build green.

## Acceptance Criteria
- [ ] "Store Traffic" outcomes render on Results with correct verdict badges + link.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green (output pasted).
