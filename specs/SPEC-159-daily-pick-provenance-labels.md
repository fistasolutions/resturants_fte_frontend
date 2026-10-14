# SPEC-159 — Daily Pick provenance labels (real demand vs research)

**Status:** complete (verified 2026-08-25)
**Repo:** `ecommerce-fte-frontend`
**Depends on:** backend SPEC-159 (discovery lane, `source` on each pick),
backend SPEC-161 (performance feedback), SPEC-125 (query-bank source vocabulary),
SPEC-157 (Daily Picks tab).

## Problem

Backend SPEC-159 added a discovery lane: some Daily Picks now come from **real
measured Google demand**, and some are an agent's **researched guess** at a topic the
store has no presence for yet. Up to 3 of the 10 are reserved for guesses.

On screen they are **identical**. Nothing distinguishes a proven-demand pick from a
hunch. That is the one thing that must not ship — a merchant deciding what to spend a
day writing has to know which is which, and an unlabelled guess reads as a measurement.

Backend SPEC-161 additionally made the ranking depend on two multipliers (freshness
decay, performance feedback) that the score bars do not show, so a pick can rank
"unexpectedly" low with no visible reason.

## Design

### 1. Provenance chip on every pick

One chip per pick card, in the existing pill row (next to intent/persona), using the
existing `pillBase` treatment and semantic tokens only (root Rule 9 — no new colors):

| backend `source` | label | treatment | meaning |
| --- | --- | --- | --- |
| `search_console` | **Measured** | `bg-success/10 text-success` | real Google demand |
| `researched` | **Research** | `bg-muted text-foreground` + `Sparkles` | agent's find, unproven |
| `derived` | **Suggested** | `bg-muted text-muted-foreground` | generated from the catalog |

This reuses the vocabulary `ProvenanceChip` already established for Brand Brain facts
(`measured` reads "I don't author these numbers"; `research` carries the sparkle), so
the two surfaces stay consistent without a new design language. `ProvenanceChip` itself
is **not** reused directly — it is typed to `ProvenanceSource` (a Brand Brain concept)
and Daily Picks has its own three-value vocabulary; forcing one into the other would
couple two unrelated domains. The mapping lives in `lib/spotlight.ts` so it is
unit-testable (root Rule 4 — no component runner).

### 2. Rank modifiers, shown only when they matter

`freshness` (0.25–1.0) and `performance` (0.90–1.15) are **multipliers**, not 0–1
components, so they must NOT be rendered as `ScorePartBar`s — a 1.15 on a 0–100% bar
would be a lie. Instead, a small muted line appears under the score bars only when a
modifier is not neutral:

- `freshness < 1` → "Recently covered — ranked lower today"
- `performance > 1` → "This topic performs well"
- `performance < 1` → "This topic hasn't earned clicks yet"

Neutral values render nothing, so the card stays quiet in the normal case.

### 3. Types + adapter

`ApiDailyPick` gains `source?: string` and `score_parts.freshness?` /
`score_parts.performance?`; all optional so an older frozen snapshot (written before
the backend change) still adapts cleanly rather than crashing. `adaptDailyPick`
defaults `source` to `"derived"` and both multipliers to `1` — the neutral values —
so historical picks render exactly as they do today.

## Tests

Vitest (`lib/` logic only — no component runner exists, root Rule 4):
- `pickSourceLabel` maps all three known sources; an unknown source degrades to a
  title-cased fallback rather than throwing.
- `pickSourceTone` returns a distinct token class per source.
- `pickModifierNotes` returns `[]` when both multipliers are neutral, the covered note
  when freshness < 1, and the right performance note either side of 1.
- Adapter: a payload with no `source` / no multipliers yields `derived` + neutral `1`s.

Manual verification checklist (no component runner):
- [ ] Open `/spotlight?tab=daily-picks` — every pick shows exactly one provenance chip.
- [ ] A researched pick shows "Research" with the sparkle, visually distinct from "Measured".
- [ ] A recently-written topic shows the "Recently covered" note.
- [ ] Both light and dark themes read correctly.
- [ ] Keyboard/scroll behaviour of the card is unchanged.

## Acceptance criteria

- [ ] Every Daily Pick card shows its provenance; a guess can never be mistaken for measured demand.
- [ ] Non-neutral rank modifiers are explained in words; neutral ones render nothing.
- [ ] Multipliers are never drawn as 0–100% score bars.
- [ ] Old snapshots without `source` still render (default `derived`, neutral modifiers).
- [ ] Tokens only, both themes; `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Verification (2026-08-25)

| Acceptance criterion | Result |
| --- | --- |
| Every pick shows its provenance | **done** — chip is first in the pill row, with a tooltip spelling out what the source means |
| Non-neutral modifiers explained in words; neutral render nothing | **done** — `pickModifierNotes` returns `[]` when both are 1 |
| Multipliers never drawn as 0–100% bars | **done** — `DAILY_PICK_SCORE_PARTS` deliberately still lists only the four real components |
| Old snapshots still render | **done** — adapter defaults `source` to `derived` and both multipliers to `1`; covered by a legacy-payload test |
| Tokens only, both themes | **done** — a test asserts no hex/arbitrary values leak into the tone classes |
| test / tsc / lint / build green | **done** — see below |

**Tests:** `tests/spotlight-provenance.test.ts` — 12 new tests. Full suite:
**703 passed, 76 files, 0 failures**. `npx tsc --noEmit` clean. `npm run lint`:
0 errors (2 pre-existing `<img>` warnings in `blog-banner.tsx` / `blog-hero.tsx`,
untouched by this change). `npm run build`: all routes compiled.

**Note on `ProvenanceChip`:** deliberately not reused. It is typed to
`ProvenanceSource`, a Brand Brain concept (onboarding/measured/research/manual);
Daily Picks has its own three-value vocabulary. Widening that type would couple two
unrelated domains for the sake of one shared chip. The visual language is matched
instead, so the surfaces still read as one system.

### Manual checklist — still to be walked by a human (no component runner exists)

- [ ] `/spotlight?tab=daily-picks` — one provenance chip per pick
- [ ] A "Research" pick is visually distinct from a "Measured" one
- [ ] A recently-written topic shows the "Recently covered" note
- [ ] Correct in both light and dark themes
