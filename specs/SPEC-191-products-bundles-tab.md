# SPEC-191 — Products → Bundles tab

Status: implemented
Depends on: backend SPEC-215 (margin-ranked bundles), SPEC-090 (product tab shell)

## Problem

Idea #13 of the 23-item set. Every upsell app on the Shopify store ranks bundle candidates
by **co-occurrence**. The most common pair is rarely the most profitable one, so a bundle
built that way raises basket size while lowering margin.

Verified on production, 90 days: the top pair by margin is worth **$12,919**, the top pair
by frequency **$8,344** — ranking by frequency picks a bundle worth 55% less.

## Design

A sixth tab on the product shell. Each candidate renders as a pair — product A `+`
product B — with each side's unit margin, then four figures: bought together, attach rate,
margin per bundle, and margin flowing.

**The frequency comparison is a tile, not a footnote.** Two tiles sit side by side — top
pair by margin, and top pair by frequency captioned *"what an upsell app picks"* — with a
callout naming the difference in money. That contrast is the entire argument for the page
existing, and burying it would leave the tab looking like a rearranged version of the
bought-together tool.

Attach rate turns success-toned at 50%+: a high attach rate is what makes a pair a real
bundle rather than a coincidence, and the closing line explains the rarer-product
denominator.

Default range is **90 days** — pair co-occurrence needs volume to mean anything.

**Nothing forecasts.** No "bundling these would earn $X": that needs the counterfactual,
which the data does not contain. The closing line says so explicitly, alongside how many
pairs were excluded for missing cost data.

## Acceptance Criteria

- [x] `/products/bundles` renders as a sixth tab in the existing shell.
- [x] Pairs ranked by margin flowing, descending.
- [x] Margin-vs-frequency contrast shown as tiles plus a money callout.
- [x] Attach rate emphasised at 50%+ and its denominator explained.
- [x] Excluded-for-missing-cost count is stated.
- [x] No projected or forecast figure anywhere.
- [x] Empty state when no pair has cost on both sides.
- [x] Tokens only; no entrance animation (Rule 9).
- [x] `npm test` green; `tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Six product tabs; Bundles active on its route.
- [ ] Top row is a co-ord pair with a high attach rate.
- [ ] The margin-vs-frequency callout shows a real difference.
- [ ] Light and dark themes both legible.
