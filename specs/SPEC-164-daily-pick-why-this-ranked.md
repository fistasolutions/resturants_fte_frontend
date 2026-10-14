# SPEC-164 — Daily Picks: "why did this rank here?"

**Status:** complete (verified 2026-08-25)
**Repo:** `ecommerce-fte-frontend`
**Depends on:** SPEC-157 (Daily Picks tab), SPEC-159 (provenance), backend SPEC-155
(the score), SPEC-159/161 (freshness + performance multipliers).

## Problem

A pick card shows four bars — **Demand 100 · Margin 71 · Catalog 38 · Brand fit 100** —
and nothing that turns them into a decision. Nobody reads "Catalog 38" and knows whether
that is good, or what to do about it. The ranking is correct and completely opaque.

Owner request: an **ⓘ** on each row that explains, in three lines, why the pick ranked
where it did.

## Design

### The explanation is COMPUTED, never generated

The obvious build is to ask the LLM. Rejected, for four reasons:

- It would make a click wait on a network round trip, and cost money every time.
- It would return a different answer each time for an unchanged pick.
- The model would be explaining numbers it did not compute — precisely what root Rule 8
  forbids, and an open invitation to invent a reason.
- **It is unnecessary.** The score is a known formula over values already on the card:
  `0.40·demand + 0.25·margin + 0.20·catalog + 0.15·brand_fit`, then `× freshness ×
  performance`. The explanation is therefore derivable, deterministic, instant and free.

`pickRankExplanation(pick, rank)` is a pure function in `lib/` — unit-tested, no I/O.

### The three lines

1. **What drove it** — the component with the largest *weighted contribution*
   (`weight × value`), not the largest raw bar. Brand fit at 100 contributes 0.15;
   demand at 80 contributes 0.32. Ranking by the raw bar would credit the wrong signal.
2. **What held it back** — the largest *weighted shortfall* (`weight × (1 − value)`),
   i.e. where this pick lost the most ground. This is the actionable line: "thin catalog"
   tells the owner to add products, not to write harder.
3. **Why now** — the one thing the bars cannot show, in priority order:
   already performing → recently covered → newly discovered → not covered recently.

### Rank-aware wording

Only #1 is the best pick of the day. Card #7 saying "this is the best" would discredit
the whole surface, so line 1 opens with "Today's top pick —" at rank 1 and "Ranked #N —"
otherwise.

### Placement

An ⓘ button beside the score badge — it explains the score, so it belongs next to it —
opening the existing shadcn `Popover`. On demand, not inline: ten cards × three lines
would be thirty lines of noise, and the card is already dense.

It does **not** duplicate the agent's rationale quote at the bottom of the card. That
explains the *editorial angle*; this explains the *ranking*. Different questions.

### Accessibility

Real `<button>` with an `aria-label` naming the pick, keyboard reachable, popover from
the shadcn primitive (focus trap and Escape included). No entrance animation beyond the
primitive's own open transition (root Rule 9).

## Tests

- Driver is chosen by weighted contribution, not raw value (a high brand-fit must not
  beat a moderate demand).
- Limiter is the largest weighted shortfall; a pick strong on everything still returns a
  sensible third-place line rather than an empty string.
- "Why now" priority: performing > recently covered > newly discovered > default.
- Rank 1 says "top pick"; rank 7 does not.
- Always exactly three non-empty lines, for every combination tried (a popover that can
  render blank is worse than no popover).

Manual checklist:
- [ ] ⓘ on every pick row, beside the score.
- [ ] Three lines, matching that pick's actual bars.
- [ ] Card #1 reads "top pick"; #7 does not.
- [ ] Keyboard: tab to it, Enter opens, Escape closes.
- [ ] Both themes.

## Acceptance criteria

- [ ] Every pick explains its own rank in three computed lines.
- [ ] No LLM call, no network request, no fabricated reason.
- [ ] Wording is rank-accurate.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Verification (2026-08-25)

| Acceptance criterion | Result |
| --- | --- |
| Every pick explains its rank in three computed lines | **done** — `pickRankExplanation(parts, rank, source)`, pure and in `lib/` |
| No LLM call, no network, no fabricated reason | **done** — derived entirely from `scoreParts` already on the card |
| Rank-accurate wording | **done** — only rank 1 says "top pick"; a test asserts rank 7 does not |
| test / tsc / lint / build green | **done** — 743 passed, tsc clean, 0 lint errors, build compiled |

**Tests:** `tests/pick-rank-explanation.test.ts` — 12 tests, including the two that pin
the reasoning rather than the wording:

- the driver is the biggest weighted **contribution**, not the tallest bar (brand fit at
  1.0 contributes 0.15; demand at 0.8 contributes 0.32 — the naive version credits the
  wrong signal);
- the shape test asserts **exactly three non-empty lines** across every combination of
  extremes and ranks, because a popover that can render blank is worse than no popover.

### Note on the mirrored weights

`SCORE_WEIGHTS` in `lib/spotlight.ts` duplicates the backend's weights. This is a real,
accepted duplication: the frontend needs them to say *which* component led, and shipping
a whole scoring payload to explain four numbers would be worse. The blast radius is
contained — a drift changes only which component gets **named**, never the rank, which
stays entirely backend-owned (root Rule 8). If the backend weights are ever retuned, this
map is the one place to follow.
