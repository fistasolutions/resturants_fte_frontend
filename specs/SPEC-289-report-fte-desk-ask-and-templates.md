# SPEC-289 — Report FTE › Desk: the ask and the templates, nothing else

Status: implemented (2026-09-22)
Depends on: SPEC-286 (the Desk's prompt block), SPEC-285 (live data), SPEC-256

## Problem

Owner, 2026-09-22, pointing at the employee card (RF · Digital employee · scorecard ·
"Open the profile") on the Desk: "I did not want this card there on the Desk page —
just the input and the templates underneath, only."

## Change

The Desk is two things, top to bottom:

1. **The ask** — the SPEC-286 prompt block, unchanged (title, textarea, Enter/Shift+Enter,
   Build it, the example chips).
2. **Templates** — the same card, now full width: the grid stays `sm:2 · lg:3` (six templates as two full rows)
   and shows the templates the desk payload carries (the "All N"
   button to the Templates tab stays).

Removed from the Desk: the employee card (its content lives on the **Profile** tab,
which is unchanged) and the Delivered / Scheduled panels (both live on the
**Delivered** tab, unchanged). `DeskView` no longer imports `Panel`/`PanelRow`/
`StatusDot`/`StatusBadge`/`ScoreTiles`/`authorityLabel`. The desk query and
`DeskData` type are untouched — the data is still served; the Desk simply does not
lay it out (Rule 7: no response field is removed).

The Desk skeleton (`skeletons.tsx` `DeskSkeleton`) matches: the prompt block, then
one full-width template grid.

## Acceptance

1. `/report-fte` shows the prompt block and the Templates card only; no "RF" card, no
   Delivered/Scheduled panels.
2. Templates render three across at ≥ 1024px, full width; the "All N" link opens the Templates tab.
3. The Delivered and Profile tabs are unchanged.
4. Docs: `lib/docs/content/report-fte.ts` Desk section describes the two-part page;
   `updated` bumped. `npm test`, `tsc`, lint, build green.

## Manual verification

- [ ] `/report-fte` at 1440 and 400px, light and dark.
- [ ] Enter in the box still lands on the Composer with the planning skeleton.
