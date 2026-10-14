# SPEC-075 — Brief: Picker To The Top + Decision-Card Compare Badges

- **Status:** Implemented
- **Date:** 2026-08-01
- **Client follow-up to SPEC-072:** (1) the range+compare picker should be
  at the top of the page, prominent; (2) it should also drive comparison
  badges on the "Today's Decisions" cards, not just the KPI strip — one
  picker for everything.
- **Backend contract:** `ecommerce-fte-backend` SPEC-069 —
  `GET /brief` now accepts the same `start`/`end`/`compare` params as
  `GET /brief/kpis` (SPEC-067), and each decision gains additive
  `amount_previous` / `amount_delta_pct` fields (compared against a saved
  daily snapshot — `null` when no snapshot exists for the anchor day, or
  when `compare=none`).

## What changes on `/brief`

1. **Picker placement:** `<DateRangePicker>` moves out of the "This Period"
   KPI section's header slot and into the top bar, next to the existing
   `BriefDatePicker` (archive dropdown) — one single instance drives the
   whole page, since every section just reads the same resolved
   `range`/`compare` from the URL.
2. **Decision cards get a compare badge:** each `DecisionCard`, when
   `amount_delta_pct` is non-null, shows a small delta badge (reusing
   `DeltaBadge` from `brief-kpis.tsx`, exported for this) next to its dollar
   amount — same up/down-triangle-and-percent styling as the KPI tiles, with
   the label taken from `COMPARE_MODES[compare].shortLabel`.
3. **`getBriefData()` now forwards the picker's `from`/`to`/`compare`** to
   `GET /brief`, so the decisions payload carries the compare fields for the
   currently-selected period. Archive view (`getBriefByDate`) is untouched —
   frozen historical snapshots don't carry live compare data, and the picker
   is already hidden there.

## Implementation

- `features/brief/brief-kpis.tsx`: export `DeltaBadge` (was private) for
  reuse by `DecisionCard`. No visual change to `BriefKpis` itself.
- `features/brief/decision-card.tsx`: render `<DeltaBadge delta={decision.amount_delta_pct} />` + a small `{deltaLabel}` caption next to the amount line, only when `amount_delta_pct` is not null/undefined (older archived snapshots won't have the field at all).
- `types/brief.ts`: `BriefDecision` gains optional `amount_previous?: number | null` and `amount_delta_pct?: number | null`.
- `services/brief.ts`: `getBriefData()` gains an optional `{ from, to, compare }` param, forwarded as `start`/`end`/`compare` query params to `GET /brief` (mirrors `getBriefRangeKpis`'s existing pattern exactly).
- `app/(app)/brief/page.tsx`:
  - Live (non-archive) call becomes `getBriefData({ from: range.from, to: range.to, compare })`; archive call (`getBriefByDate`) unchanged.
  - `<DateRangePicker>` moves from `BriefKpis`'s `headerActions` slot into the top bar (next to `BriefDatePicker`), rendered only when `!isArchive` (same reasoning as SPEC-072 — archive is frozen, live compare data doesn't apply there).
  - The "This Period" `<BriefKpis>` section drops its `headerActions` prop (no longer needed — the picker lives at the top now); its heading/deltaLabel stay as before.
  - Decision cards render inside the existing `<DecisionCard>` loop unchanged in structure — they now just receive decision objects that carry the new fields when live.

## Tests

- No new pure logic introduced (compare-window resolution, `DeltaBadge`
  rendering rules already exist and are covered) — full Vitest suite +
  `tsc` + `build` re-run to confirm no regression (Rule 7).

### Manual verification checklist

- [ ] Picker sits at the top of `/brief`, next to the archive dropdown.
- [ ] Decision cards show a delta badge matching the picker's compare mode;
      badge disappears when `compare=none`.
- [ ] Archive view still hides both the picker and any decision delta badge.
- [ ] Light/dark theme, mobile width.

## Acceptance criteria

- [x] One `<DateRangePicker>` instance, positioned at the top of the page.
- [x] Decision cards show compare badges sourced from the backend's
      `amount_delta_pct`, reusing the existing `DeltaBadge` component.
- [x] `getBriefData` forwards range/compare to `GET /brief`; archive path
      untouched.

## Patches

- 2026-08-01 — **The two top-bar pickers must be fully independent (client
  feedback: "why does the History dropdown change when I change the
  filter?").** `DateRangePicker`'s `OWNED_PARAMS` includes `"date"` — on
  Dashboard/Products/Inventory/Orders that's the picker's own legacy
  single-day param (SPEC-028), correctly cleared on Apply. On Brief, `date`
  means something unrelated: which archived day's frozen snapshot to show
  (`BriefDatePicker`). Applying the range/compare picker was deleting that
  archive selection as a side effect, silently exiting archive view. Added
  an opt-in `preserveDateParam?: boolean` prop (default `false` — every
  other consumer unchanged, Rule 7) to `DateRangePicker`; Brief passes
  `preserveDateParam` so Apply never touches `date`. The two pickers now
  only change what they each own.
