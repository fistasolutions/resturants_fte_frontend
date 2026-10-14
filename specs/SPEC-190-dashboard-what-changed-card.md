# SPEC-190 — Dashboard: What changed, and why

Status: implemented
Depends on: backend SPEC-214 (revenue change decomposition), SPEC-184 (dashboard cards)

## Problem

Idea #15 of the 23-item set. The dashboard says "revenue down 12%" and stops. Answering
*why* means opening four pages and guessing.

## Design

A card directly beneath the net-sales waterfall: the total change against the previous
period of equal length, then the biggest contributing products, each with what visibly
moved.

**It is a decomposition, not a causal claim — and the copy says so.** Every product's
delta sums exactly to the store's delta, which is arithmetic and cannot be wrong. The
per-product signal is drawn only from observed facts: units moved, revenue per unit moved,
stock is zero. `Sold out` is the only signal that behaves like a cause and it is a
fact — the product has no stock and was selling before — so it takes the destructive tone.
The card never says "the ad set was paused" or "the season turned"; nothing in the data
supports it.

**Concentration is the headline insight, not the list.** A line reports what share of all
movement the top five carry, and reads it back in plain words — under 25% the change is
broad, above it the change is a handful of products. Verified on production: the top five
carry **5.4%**, so the store's 77.3% growth is broad-based, which is a materially different
message from "five products did it" and is invisible in any ranked list.

Gainers and losers both render — a store can be down overall while something is up, and
hiding that makes the picture wrong. The card returns null on failure so the dashboard
degrades to its previous shape; this is a supporting card, not the page.

## Acceptance Criteria

- [x] Card sits under the net-sales waterfall on `/dashboard`.
- [x] Total delta with direction, colour and percentage.
- [x] Movers listed with units before → after, stock, signal and signed delta.
- [x] `Sold out` visually strongest; gainers in success tone.
- [x] Concentration stated and interpreted in words.
- [x] Card is omitted entirely when unavailable or nothing moved.
- [x] Fetched in parallel with the dashboard payload, never waterfalled (Rule 5).
- [x] Tokens only; no entrance animation (Rule 9).
- [x] `npm test` green; `tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Card renders under the waterfall with a signed total.
- [ ] A sold-out product shows the destructive `Sold out` chip.
- [ ] Concentration sentence matches the percentage shown.
- [ ] Light and dark themes both legible.
