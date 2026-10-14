# SPEC-220 — Inventory → Allocation tab

Status: implemented
Backend: SPEC-229 (`GET /analysis/inventory/allocation-plan`)
Implements the client-facing half of idea #16.

## Problem

Store-to-store transfers exist per destination and in the Morning Brief. To plan a
week the owner opens each location in turn and assembles the picture himself. The
missing surface is the consolidated, ranked list — every worthwhile move in one
place, in the unit a van actually does.

## What this builds

A tab at `/inventory/allocation` (`hasRange: false` — current stock state).

### Layout

1. **Three tiles** — runs, units to move, expected value.
2. **One card per run**, ranked by value, headed `Pomona → Lawrence` with the run's
   units and expected value, and a table of items (product, source stock, days
   unsold at source, destination sold, destination stock, units to move, unit price,
   expected value).
3. A run already raised through the brief shows a muted **"Sent {date}"** chip
   instead of appearing to be new work.

### The capping rule is surfaced

A line under the tiles states: *"Units to move are capped at what the destination
has actually been selling — moving more relocates dead stock rather than clearing
it."* This is the design decision most likely to be questioned ("why only 12 when
there are 40?"), so the page answers it in place.

`expected_value` is labelled **gross** — no freight cost exists in the platform.

### Filters

A filter bar above the tiles: product search, source location, destination location.
Locations are derived from the runs present, so the selects never offer a value that
would return nothing. Run and plan totals are recomputed from what survived — a
header still reading $352k over two filtered rows is a number nobody can trust — and
the bar shows "N of M runs" throughout.

## Design (Rule 9)

Tokens only; run direction rendered with a Lucide `ArrowRight`, not brand red.
No entrance animation.

## Verification (manual)

1. `/inventory/allocation` renders with the tab active.
2. Runs ranked by expected value descending.
3. Each run's total equals the sum of its item values.
4. `move_units` never exceeds either source stock or destination units sold.
5. A previously-sent run shows the Sent chip.
6. Capping explanation and "gross" label both visible.
7. Empty state when no moves qualify. Light/dark correct.
