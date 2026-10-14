# SPEC-188 — Results → Value Ledger tab

Status: implemented
Depends on: backend SPEC-207 (value ledger), SPEC-063 (results page)

## Problem

Idea #6 of the 23-item set — the one that decides a renewal. `/results` has ten tabs, one
per send type, each answering "did this kind of message work". Nothing answers the
question an owner actually asks: **how many actions were taken, how many worked, and what
were they worth.**

## Design

A **first** tab, `Value Ledger`, ahead of the ten type tabs — the roll-up belongs above
its own detail. The existing tabs are untouched.

Four tiles: actions taken, worked, still measuring, and measured value. Then a
chronological ledger across every category with its verdict badge (reusing the existing
`verdictBadge`), the category it came from, and the value where one exists.

**The honesty requirement is the design.** Only winback entries carry an attributed value
— a named customer list was synced and those customers' subsequent orders are theirs.
Transfers and the operational outcomes carry none, because attributing a store's revenue
swing to a transfer would be an inference dressed as a measurement.

So the value tile is captioned with **`actions_with_value` of `actions_taken`**, and rows
with no value show an em-dash with a tooltip-free explanatory line rather than `$0`. A
reader must never be able to mistake the total for full coverage — that is precisely the
mistake that makes a renewal conversation go badly.

Where a row does carry a value, its `value_basis` sentence renders beneath it, so any
number on the page can be traced without leaving it.

## Acceptance Criteria

- [x] `Value Ledger` is the first tab; the ten existing tabs are unchanged.
- [x] Tiles: actions taken, worked, still measuring, measured value.
- [x] The value tile states how many actions are monetised, not just the total.
- [x] Entries are chronological, newest first, and labelled with their category.
- [x] Rows without a value show "—", never `$0`.
- [x] A valued row shows its `value_basis`.
- [x] Empty state when no actions have been taken.
- [x] Tokens only; no entrance animation (Rule 9).
- [x] `npm test` green; `tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Value Ledger opens by default and lists actions across all types.
- [ ] Measured-value tile shows "N of M actions" beneath the figure.
- [ ] A transfer row shows "—", a winback row shows money plus its basis.
- [ ] Light and dark themes both legible.
