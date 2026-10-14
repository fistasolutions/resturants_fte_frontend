# SPEC-224 — Morning Brief: dynamic attention and ranked decisions

Status: implemented
Backend: SPEC-233 (detector registry)
Mockup: `ref/dynamic-brief-mockup.html`

## Problem

Both blocks on the brief are fixed lists. The same five attention cards and the same
plays render every morning regardless of what happened, and each card shows a raw
backlog — "2,663 open · oldest 144d" — with nothing to compare it against. It has
read the same for weeks, so it has stopped being read.

## What this builds

### Attention cards carry the comparison, not the absolute

Every card shows the value **and what makes it unusual**:

> **Returns spiked on one product** · 41
> Ruched Knot Dress-Floral — 41 returns in 3 days vs 6 normal &nbsp; `+583% vs 30-day norm`

The delta chip is the element that turns a number into news, so it is not optional
decoration — a card without one is a card the reader has no reason to act on today.

Each card also names **which integration saw it** (LOOP, GORGIAS, V-COUNT, IPACKY,
SHOPIFY, TAX), because six of the ten checks watch systems the brief could not reach
until SPEC-231 and the provenance is what makes a new alarm believable.

### Ranked, capped, expandable

Cards arrive ranked by money at stake. The page shows the **top five** and collapses
the remainder behind "Show N lower-value alerts". Compact on an ordinary morning,
complete when the reader wants it.

### The header states what ran

`6 of 10 checks fired` sits at the section head. Silence has to be distinguishable
from breakage: without this line an empty block could mean "all clear" or "the
detectors crashed", and those are opposite messages.

### Empty states

- **Attention, nothing fired** — *"Nothing needs your attention this morning."* with
  the count of checks that ran. A good outcome, stated as one.
- **Decisions, nothing ready** — *"No decisions waiting."*

Both use the success token, not a muted grey — a clean morning is a result, not an
absence of data.

### Decisions

Ranked by value and shown only above their floor. Unchanged in every other respect:
the same evidence block, the same Review & Send / View / Skip actions, the same send
history. This is a filter and a sort, not a redesign of a working flow.

## Design (Rule 9)

Semantic tokens only. Severity uses `--destructive` and the amber warning token;
brand red stays identity-only. Delta chips are outlined, never filled — a page with
six filled red pills reads as a crisis every morning, which is the failure being
fixed. No entrance animation; the block renders in its final position.

## Verification (manual — no component runner, Rule 4)

1. A morning where several detectors fire shows them ranked by money, top five.
2. Every card shows a delta chip and a source label.
3. The expander reveals the remainder and toggles back.
4. The header count matches the number of cards plus hidden ones.
5. Both empty states reachable and correctly worded.
6. Decisions ranked by value; a zero-value play is absent.
7. Light and dark themes both correct.
8. A card with a very long product title wraps without breaking the grid.

## Patches

### 2026-09-09 — a falling metric was tinted green on a red alert card

`deltaToneClass` picked its colour from the **sign of the number**: a leading minus
made the chip `--success`. Two of the nine detectors fire on a fall —
`store_conversion_drop` and `aov_drop` — so Jackson's conversion collapse rendered
as a reassuring green `−15.6 pts` chip sitting inside a destructive-red card that
also carried a red alert icon and a red count. The one element on the card whose
whole job is to say *this is news* was saying the opposite.

The tone now follows the finding's own `status`, exactly as the tile background,
the severity icon and the count already do: `error` → `--destructive`, `warn` →
the amber warning token. A detector only ever contributes a card when it fires,
and it only fires on a deterioration, so there is no case on this surface where a
green chip is correct.

Still outlined, never filled (the original rule stands), and brand red remains
identity-only. `deltaToneClass(delta, status)` takes the severity as a second
argument, defaulting to `error`, so the signature stays additive.
