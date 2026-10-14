# SPEC-192 — Foresight → Launch Watch tab

Status: implemented
Depends on: backend SPEC-216 (launch watch), SPEC-152 (foresight shell)

## Problem

Idea #11 of the 23-item set. The reorder lead time is **six weeks**. A style spotted as a
winner at day 60 is a winner missed — the reorder lands after the season it was meant to
serve. Nothing watched new drops; Season Radar forecasts categories, not individual
launches.

Production: **856 styles first sold in the last 45 days, 210 at or above winner pace, and
152 of those have under six weeks of stock.** The fastest — `Mixed Stripe Trumpet Skirt` —
sold **142 units by day 14 against a winner's 23 (6.17×) and is already at zero cover.**

## Design

A sixth tab on the foresight shell. No date-range picker: a drop's window is **its own
age**, not a period someone picked, so a range control would be meaningless here.

Four tiles — drops watched, at/above winner pace, **reorder now**, and what a winner had
sold by day 7/14/30 — then a table: age, units by that milestone, the winner benchmark,
the pace multiple, stock, cover, verdict.

**"Reorder now" is the tile that matters** and it is a conjunction, not a ranking: winner
pace **and** under six weeks of cover. Pace alone is interesting; pace with stock running
out is the decision. Those rows are tinted and a callout names the count against the
six-week lead time.

The closing note carries the two things that make the numbers trustworthy — age runs from
**first sale**, not Shopify creation, and each drop is scored at the largest milestone it
has actually lived through — plus the benchmark's basis. Without them a reader cannot tell
whether a 6× is real or an artefact of comparing a nine-day-old style to a month of
someone else's sales.

## Acceptance Criteria

- [x] `/foresight/launch` renders as a sixth tab in the existing shell.
- [x] No date-range picker on this tab.
- [x] Tiles: drops watched, at/above winner pace, reorder now, winner benchmark.
- [x] Urgent rows tinted; callout states the count against the six-week lead time.
- [x] Table shows age, milestone units, benchmark, pace multiple, stock, cover, verdict.
- [x] Un-scored drops show "—", never a zero pace.
- [x] Closing note explains first-sale anchoring, milestone fairness and benchmark basis.
- [x] Empty state when nothing sold in the window.
- [x] Tokens only; no entrance animation (Rule 9).
- [x] `npm test` green; `tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Six foresight tabs; Launch Watch active on its route.
- [ ] Top row is the fastest drop with a pace multiple above 1×.
- [ ] A drop at winner pace with thin cover is tinted.
- [ ] Light and dark themes both legible.

## Patches

### 2026-09-17 — header alignment (quick fix)

The Style / Verdict column headers rendered right-aligned over left-aligned cells. `` `${HEAD} text-left` `` never won because Tailwind resolves a `text-left`/`text-right` conflict by stylesheet order, not by the order the classes appear in the string. `launch-watch-view.tsx` now splits the base into `HEAD_BASE` with `HEAD` (right) and `HEAD_LEFT` (left) — the same pattern the Cash Release and Allocation tables already use.
