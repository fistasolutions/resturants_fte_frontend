# SPEC-181 — Show first-touch & last-touch blog attribution

**Status:** frontend slice of backend **SPEC-197** (order customer-journey attribution).
**Depends on:** backend SPEC-197 (the contract), frontend SPEC-126-blog-render /
SPEC-163-spotlight-tab-restructure (the Published tab this lands in).
**Governs:** how blog → revenue attribution is displayed. **Additive** — no existing
component loses a field.

## Why

The Published tab currently shows one number per post: `attributedRevenue`, from the
backend's SPEC-126 landing measure. That measure only sees a buyer who *entered the site
on the article and bought in that same session*, so on the live store it reads
**"No attributed sales yet"** for every post — which the owner cannot distinguish from
"the blogs earned nothing".

Backend SPEC-197 now returns two more measures per post — `first_touch_*` (the visit that
introduced the buyer, possibly days before checkout) and `last_touch_*` (the visit they
bought on) — plus `journey_coverage`, which says how much of the window has actually been
looked at. This spec surfaces them.

## Scope

1. **Types** (`types/spotlight.ts`) — `PublishedPost` gains `firstTouchOrders`,
   `firstTouchRevenue`, `lastTouchOrders`, `lastTouchRevenue`. Additive; existing
   `attributedOrders`/`attributedRevenue` keep their meaning and their name.

2. **Adapter** (`lib/adapters.ts`) — `adaptPublishedPost` maps the four new snake_case
   fields, defaulting to `0`. A missing field is **0, never a fabricated number**
   (root Rule 8), exactly as the existing attribution fields already behave.

3. **Attribution summary helper** (`lib/blog-attribution.ts`, new) — a pure function
   turning one post's three measures into what the card renders: the **strongest
   non-zero measure** and its label, so a post that earned a first-touch sale stops
   reading "No attributed sales yet". Precedence, strongest proof first:
   `attributed` (entered on the article and bought that session) →
   `lastTouch` (last thing they saw) → `firstTouch` (what introduced them) → none.
   Pure and in `lib/` so Vitest covers it (Rule 4 — there is still no component runner).

4. **Published post card** (`features/spotlight/published-post-card.tsx`) — render the
   helper's result: revenue, order count, and a short qualifier naming *which* measure
   it is ("first touch" / "last touch"), because a first-touch dollar and a
   same-session dollar are not the same claim and must not be shown as if they were.
   Zero state stays honest.

5. **Coverage line** (`features/spotlight/published-tab.tsx`) — when
   `journeyCoverage.ratio < 1`, a single muted line stating how much of the window has
   been measured. This is the difference between "your blogs earned nothing" and "we
   have not looked at these orders yet", and the owner must never have to guess which
   one a zero means.

6. Tokens only, both themes, no Framer Motion (Rule 9). No new dependency.

## Tests

- `lib/blog-attribution.ts` unit tests: precedence across all four cases; a post with
  only first-touch revenue does NOT read as "no attributed sales"; zero stays zero;
  singular/plural order wording.
- Adapter test: the four new fields map, and a payload missing them yields `0` rather
  than `undefined`/`NaN`.
- `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green (Rule 7).

## Manual verification checklist (no component runner exists — Rule 4)

- [ ] Published tab renders each post's strongest measure with its qualifier.
- [ ] A post with no attribution of any kind still reads "No attributed sales yet".
- [ ] The coverage line appears only while coverage is partial, and reads honestly.
- [ ] Light and dark themes both correct; keyboard focus order unchanged.

## Acceptance criteria

- [ ] `PublishedPost` carries the four new fields; adapter defaults them to 0.
- [ ] `lib/blog-attribution.ts` is pure, unit-tested, and owns the precedence rule.
- [ ] The card names which measure it is showing; the zero state is unchanged.
- [ ] Coverage is stated whenever it is partial.
- [ ] Tests, tsc, lint and build green.

## Patches

- **2026-08-31 — implemented.** `PublishedPost` + `adaptPublishedPost` carry the four
  journey fields (absent → 0, never fabricated); new `JourneyCoverage` type +
  `adaptJourneyCoverage`; new `lib/blog-attribution.ts` owning the precedence rule
  (`attributed` → `lastTouch` → `firstTouch` → `none`), the order-count wording, and the
  coverage note; `services/spotlight.ts` gains `getJourneyCoverage()`; the Published card
  renders the strongest measure with its qualifier plus an `sr-only` description of what
  was actually measured; the tab shows the coverage line only while coverage is partial.
  - **Deviation (a fix, not a scope change):** `app/(app)/spotlight/page.tsx` awaited
    `getPublished()` and then `getVisibility()` **sequentially** — a waterfall against
    root Rule 5. Rather than making it three-deep by appending the coverage read, all
    three now run in one `Promise.all`, so wall time is the slowest call rather than
    their sum. Both enrichments stay best-effort (`.catch`), so neither a Search Console
    hiccup nor an unreadable coverage can fail the tab.
  - One existing assertion in `tests/spotlight-adapter.test.ts` deep-equals the whole
    adapted post, so it was extended with the four additive fields — the fields are
    additive, the assertion was exhaustive.
  - **Verified:** `npm test` 990 passed (93 files), `npx tsc --noEmit` clean,
    `npm run lint` 0 errors (3 pre-existing `no-img-element` warnings, untouched files),
    `npm run build` compiled successfully in 4.6s.

## Acceptance criteria — verified 2026-08-31

- [x] `PublishedPost` carries the four new fields; adapter defaults them to 0.
- [x] `lib/blog-attribution.ts` is pure, unit-tested (14 tests), owns the precedence rule.
- [x] The card names which measure it is showing; the zero state is unchanged.
- [x] Coverage is stated whenever it is partial.
- [x] Tests, tsc, lint and build green.
- [ ] Manual checklist above — **not yet walked through in a browser** (no component
      runner exists). The live store currently has all three measures at 0, so the
      card's non-zero paths are covered by unit tests only until a blog earns a sale.
