# SPEC-058 — Money Finder: Segment Cards, Hero Strip, AI Draft Email

- **Status:** Implemented
- **Date:** 2026-07-25
- **Backend:** SPEC-051-money-finder-category-and-discount-segments.md.
- **Owner request:** the earlier `/customers` page (SPEC-056) only had two
  segments and no combined "size of the opportunity" number, unlike the
  mockup. Add the two real segments (Category Lovers, Sale-Only Shoppers),
  a hero stat strip, and the "Draft email" action — review-only, a Copy
  button, never an auto-send.

## Design

### Hero strip

Two stats, computed server-side (`hero.total_customers`,
`hero.total_value` — already deduplicated across every segment on the
backend, never re-summed or estimated in the frontend per root Rule 8).

### Segment cards (Category Lovers, Sale-Only Shoppers, VIPs)

Restyled to match the mockup's card pattern — icon-free (no emoji per this
repo's icon convention, Lucide outline instead), name, $ value, one-line
description, two actions:

- **Export CSV** for Category Lovers and Sale-Only Shoppers (streams from
  `GET /customers/money-finder/{segment}/export`).
- **VIPs card keeps its existing "Review & sync to Klaviyo" link** to
  `/brief/winback` — no CSV export added there (SPEC-051's own reasoning:
  that segment's full review-and-send already exists; a second unreviewed
  export path would contradict it).
- **Draft email** (all three cards) opens a client-side review panel:
  calls `POST /customers/money-finder/draft-email`, shows the returned
  subject/body in editable fields, a **Copy** button
  (`navigator.clipboard.writeText`) and a note that nothing is sent from
  here. Loading and error states (the LLM call can fail — the backend
  already falls back to a deterministic draft, but the frontend still
  shows a spinner while waiting and a retry affordance if the network
  call itself fails).
- Cards that don't currently qualify (`category_lovers: null`,
  `sale_only_shoppers: null`) render as a plain empty-state line ("Not
  enough signal yet for this segment") — never hidden silently, never a
  fabricated card.

### Due to Reorder section unchanged, gains a Draft nudge email button

Same table as SPEC-056; the existing Export CSV button is joined by a
"Draft nudge email" button using the same review panel component.

## Tests (Rule 4)

No new pure-logic module (the draft-email panel is UI state, not parseable
logic) — ships with the manual verification checklist, per this repo's
no-jsdom-runner convention.

## Acceptance criteria

- [x] Hero strip shows the backend's deduplicated totals.
- [x] Category Lovers + Sale-Only Shoppers cards render real data or an
      honest empty state.
- [x] Draft-email panel: loading/success/error states, Copy button, no
      send capability anywhere in the frontend.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Hero numbers match the sum you'd expect from the segments shown.
- [ ] Draft email produces real, segment-specific copy (not a generic
      placeholder) and Copy actually copies it.
- [ ] Empty-segment states read clearly, not like a bug.
- [ ] Both themes; 375px responsive.

## Patches

- **2026-07-25 (owner report: hero-strip stats looked inconsistently
  aligned — "this UI sucks"):** the strip was a plain `flex flex-wrap`
  row with no explicit `justify`/text alignment, which rendered each
  stat inconsistently depending on viewport width. Rebuilt as an explicit
  `grid grid-cols-1 sm:grid-cols-3` with `divide-x`/`divide-y` dividers
  and `text-left` on every cell — deterministic alignment at every
  breakpoint instead of relying on flex-wrap fallback behavior. Verified
  at both 1440px (3 columns, vertical dividers) and 375px (stacked,
  horizontal dividers).
