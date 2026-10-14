# SPEC-187 — Returns → Product Fixes tab

Status: implemented
Depends on: backend SPEC-206 (return-reason fixes), SPEC-095 (returns workspace)

## Problem

Idea #3 of the 23-item set. The Returns workspace shows how much came back, from which
styles, in which sizes. It does not say **what to change so the next one doesn't**.

Production, trailing 90 days: 877 returned lines, every one carrying a reason.
**70.7% are sizing** ("too small" 38.5%, "too big" 32.2%), and **96.2% of returned value
— $61,384 of $63,818 — is attributable to a reason a product-page edit can address.**

## Design

A fifth tab on the existing URL-driven returns tab bar: Overview · By Style · Sizing ·
Categories · **Product Fixes**. Same `?tab=` mechanism, same range params.

**Reason mix** first — every reason with its share, its money, and the fix it implies —
because the store-wide shape (sizing dominates) is the finding before any single product
is. Sizing rows are tinted with the existing `warning` token, matching `reason-bar.tsx`.

**Then the product table**, ranked by value at stake: product, returns, refund value,
dominant reason with its share, the fix, and the money attributable to that reason.

**Two honesty requirements in the UI, not just the API:**

1. `value_at_stake` is labelled **"at stake"**, never "saving". It is money that already
   went out for that reason. Calling it a saving would promise a fix effectiveness nobody
   has measured.
2. A **coverage line** states that only Loop returns carry a reason — 877 of 15,310 refund
   lines (5.7%) — so the page cannot be mistaken for a view of all returns. Without it the
   tab silently implies the other 94% don't exist.

Rows whose reason maps to no page fix render muted, so the eye goes to the actionable ones.

## Acceptance Criteria

- [x] `?tab=fixes` renders as a fifth tab, range params preserved.
- [x] Reason mix listed with share, value and mapped fix; sizing tinted.
- [x] Product table ranked by value at stake, descending.
- [x] The column is labelled "at stake", never "saving".
- [x] Coverage line states the Loop-only limitation with real numbers.
- [x] "No page fix" rows visually muted.
- [x] Empty state when no reasoned returns in range; API failure uses the existing
      Loop-not-connected message.
- [x] Tokens only; no entrance animation (Rule 9).
- [x] `npm test` green; `tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Five tabs; Product Fixes active on `?tab=fixes`.
- [ ] "Item was too small" is the top reason row and maps to Size chart + fit note.
- [ ] Coverage line reads 5.7% (or current) and names Loop.
- [ ] Light and dark themes both legible.

## Patches

### 2026-09-17 — header alignment (quick fix)

The Product / Top reason / Fix column headers rendered right-aligned over left-aligned cells. `` `${HEAD} text-left` `` never won because Tailwind resolves a `text-left`/`text-right` conflict by stylesheet order, not by the order the classes appear in the string. `fixes-tab.tsx` now splits the base into `HEAD_BASE` with `HEAD` (right) and `HEAD_LEFT` (left) — the same pattern the Cash Release and Allocation tables already use.
