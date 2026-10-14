# SPEC-078 — Brief Compare: Plain-Language Verdict + Real Comparison Dates

- **Status:** Implemented
- **Date:** 2026-08-01
- **Client follow-up to SPEC-075:** a bare percentage badge doesn't say
  whether the change is good or bad news, and "vs previous period" doesn't
  say *which* period. Two asks: (1) spell out a plain-language verdict
  alongside the percentage; (2) name the actual compared-against date/range
  instead of the generic compare-mode label.

> Implementation note: this patch was coded directly (no spec drafted
> first) — documenting it here after the fact per root Rule 3's spirit,
> since the change was small and the client was mid-conversation asking for
> a quick follow-up. Logged as a full spec anyway rather than only a
> Patches note, since it's real product behavior worth a proper record.

## What changes

1. **Real comparison date**, both on the "This Period" KPI section and on
   decision-card compare badges — e.g. "vs Jul 31, 2026" instead of
   "vs previous period". Computed purely client-side via the *existing*
   `compareRangeFor()` + `formatRangeLabel()` in `lib/date-range.ts` (already
   used elsewhere, already tested in `tests/date-range.test.ts` — no new
   pure logic, just new call sites).
2. **Plain-language verdict on decision cards** — "Worse than {date}" /
   "Better than {date}" for risk-sentiment decisions (`unfulfilled_48h`:
   more overdue $ is objectively worse), "Bigger than {date}" /
   "Smaller than {date}" for opportunity-sentiment decisions
   (`transfer_opportunity`, `dormant_vips`: growing $ is framed as more
   upside, not moralized as good/bad). The existing `sentiment` field
   (already present on every `BriefDecision`, already used for the card's
   red/green amount color) drives this — no new backend field needed.
3. **Decision-card badge color now matches sentiment too** — previously
   `DeltaBadge` on decision cards was never passed `invertDelta`, so an
   *increase* in overdue-order value showed green (wrong — more overdue $
   is bad news). Now `invertDelta={decision.sentiment === "risk"}`, matching
   the same inversion `BriefKpis`'s Refunds tile already uses.

## Implementation

- `features/brief/decision-card.tsx`: new `compareVerdict(deltaPct, sentiment)` pure function; badge row renders `<DeltaBadge invertDelta={isRisk} />` + `{verdict} {compareLabel}` (e.g. "Worse than Jul 31, 2026").
- `app/(app)/brief/page.tsx`: `comparePeriodLabel` computed once via `compareRangeFor(range.from, range.to, compare)` → `formatRangeLabel(...)`, fed to both the KPI section's `deltaLabel` and each `DecisionCard`'s `compareLabel` prop — replacing the old `COMPARE_MODES[compare].shortLabel` generic text at both call sites.

## Tests

- No new pure logic (`compareRangeFor`/`formatRangeLabel` are pre-existing,
  already tested) — `compareVerdict()` is a 4-branch pure function, trivial
  enough that the existing full-suite re-run (Rule 7) is the verification;
  a dedicated unit test would just restate its own if/else.
- Full Vitest + `tsc` + `build` re-run to confirm no regression.

## Acceptance criteria

- [x] Decision-card badges name the real compared-against date.
- [x] Decision-card badges show a plain-language verdict, sentiment-aware.
- [x] Decision-card badge color correctly inverts for risk-sentiment cards.
- [x] "This Period" KPI section's delta label also names the real date.

## Patches

- 2026-08-01 — **Arrow direction now always follows the literal number;
  color carries good/bad (client feedback, walked through with a concrete
  24→34 example).** Previously `DeltaBadge`'s arrow flipped with
  `invertDelta` too, so a risk metric that got worse (e.g. unfulfilled
  orders 24→34, +41.7%) rendered a *down*-arrow next to a "+41.7%" —
  visually contradictory. Split the two concerns in `brief-kpis.tsx`'s
  `DeltaBadge`: `increased = delta >= 0` always drives the arrow;
  `isGood = invertDelta ? delta <= 0 : delta >= 0` (the old `positive`
  logic, unchanged) drives only the color. This is the shared component
  behind both the KPI tiles and the decision-card badges, so the fix is
  one change, applied everywhere `DeltaBadge` is used (including the
  Refunds KPI tile, which had the exact same arrow/number mismatch).
