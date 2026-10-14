# SPEC-213 — Products → Content Gaps tab

Status: implemented
Depends on: backend SPEC-212 (content gaps), SPEC-090 (product tab shell)

## Problem

Idea #14 of the 23-item set. The platform can already generate product imagery; nothing
said which products need it.

Production, 90 days: **1,729 of 3,722 selling products are flagged, with $3.43M of
revenue behind them — 244 of them sell with no image at all.**

## Design

A fifth tab on the product shell. Table ranked by revenue, so the products where a missing
image costs the most sit at the top: product, image count, units, revenue, revenue per
image, and the gap classification. A zero image count is rendered destructive-toned — a
selling product with no photograph is the strongest signal on the page.

**No conversion rate anywhere.** The original idea framed this as "products converting 40%
below catalogue average". Session and impression data are not synced, so that number cannot
be computed and anything presented as one would be invented. A closing line says so, rather
than leaving the reader to assume the omission is an oversight.

`revenuePerImage` renders "—" for zero-image products rather than an infinity or a zero.

## Acceptance Criteria

- [x] `/products/content-gaps` renders as a fifth tab in the existing shell.
- [x] Ranked by revenue; zero-image rows visually strongest.
- [x] Revenue per image shows "—" when there are no images.
- [x] The page states that no conversion rate is available and why.
- [x] Empty state when every selling product has a full gallery.
- [x] Tokens only; no entrance animation (Rule 9).
- [x] `npm test` green; `tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Five product tabs; Content Gaps active on its route.
- [ ] Top rows are high-revenue single-image products; no gift card appears.
- [ ] Light and dark themes both legible.

## Patches

### 2026-09-17 — header alignment (quick fix)

The Product / Gap column headers rendered right-aligned over left-aligned cells. `` `${HEAD} text-left` `` never won because Tailwind resolves a `text-left`/`text-right` conflict by stylesheet order, not by the order the classes appear in the string. `content-gaps-view.tsx` now splits the base into `HEAD_BASE` with `HEAD` (right) and `HEAD_LEFT` (left) — the same pattern the Cash Release and Allocation tables already use.
