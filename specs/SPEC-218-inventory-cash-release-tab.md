# SPEC-218 — Inventory → Cash Release tab

Status: implemented
Backend: SPEC-227 (`GET /analysis/inventory/cash-release-plan`)
Implements the client-facing half of idea #5.

## Problem

Dead Stock tells the owner what is stuck. It does not tell him what to do about it
this week, next week, or the week after — which is the only form the answer is
usable in, because the money is meant to fund the next buy.

## What this builds

A new tab at `/inventory/cash-release`, added to `INVENTORY_TABS` with
`hasRange: false` — the plan is the state of the stockroom right now, not a windowed
measurement, exactly like Data Stock and Data Trust.

### Layout

1. **Four summary tiles** — products in the plan, stock value, expected cash,
   margin given up.
2. **A six-week schedule.** One card per week: the week number, its Monday date, a
   slate total, and the item table (product, bucket, days since last sale, units,
   stock value, discount depth, expected cash).
3. **An honesty line, permanently visible**, directly under the tiles: *"Expected
   cash is a recovery estimate at the recommended depth — not a forecast of
   sell-through."* Same discipline as the Data Trust page: a figure that could be
   put into a cash plan must carry its own limits.

### Filters

A filter bar above the tiles: product search, week, and age bucket. Client-side —
the plan is one aggregate the server already sent whole, so a substring match needs
no round trip.

**Every total is recomputed from what survived the filter.** Leaving the server's
totals above a filtered list produces a card that does not add up, which is the
fastest way to lose a reader's trust in a money figure. The bar also shows
"N of M products" at all times, so a filter can never silently hide rows.

A filtered-to-nothing result gets its own state, distinct from "no dead stock at
all" — the two mean opposite things.

### States

- **Loading** — the shared skeleton convention.
- **Empty** — no dead stock at all: a plain statement, not an error card.
- **Error** — the standard error surface.

## Design (Rule 9)

Semantic tokens only. Discount depth uses `--muted` chips, never brand red — the
brand colour is identity-only. No entrance animation of any kind; the table renders
in its final position.

## Verification (manual — no component runner exists yet, Rule 4)

1. `/inventory/cash-release` renders and the tab is active in the shell.
2. Week cards are Monday-dated and ascending.
3. Every week's slate total equals the sum of its rows.
4. Tiles equal the plan totals returned by the API.
5. The estimate caveat is visible without scrolling.
6. Light and dark themes both correct.
7. Range picker is absent (`hasRange: false`).
