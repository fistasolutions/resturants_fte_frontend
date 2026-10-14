# SPEC-189 — Customers: Segments and Repeat Clock tabs

Status: implemented
Depends on: backend SPEC-208 (segments), backend SPEC-209 (repeat clock), SPEC-051 (Money Finder)

## Problem

Ideas #9 and #19 of the 23-item set.

`/customers` is a single page — the Money Finder. It has no tab shell, so the two new
customer views have nowhere to live and no way to be found.

**#9 Segments.** Production, 90 days: **6,089 customers have never taken a discount and
spent $3.49M**, while **1,680 discount-only customers took $805,568 of discount for
$525,820 of revenue** — more discount than revenue.

**#19 Repeat Clock.** 67,236 measured customers: **median gap to second order is 103
days**, p25 17, p75 326 — and 18.9% come back inside a week. The winback flow currently
fires on a fixed window nobody measured.

## Design

**A tab shell for `/customers`**, matching the products and discounts workspaces: a
`layout.tsx` renders `CustomersTabs` above the child route, so the bar stays mounted
across switches. Three tabs — Money Finder (the existing page, unchanged), Segments,
Repeat Clock. Tab model lives in `lib/customer-tabs.ts`, framework-free and unit-tested
like its siblings.

**Segments** renders four cards, one per segment, with customers, orders, revenue, AOV and
discount received. Discount is shown *beside* revenue deliberately: a segment's cost and
its value belong in the same eye-line, which is what makes "more discount than revenue"
visible at a glance. A note reports guest orders excluded.

**Repeat Clock** leads with the median (not the mean — the distribution is heavily
right-skewed and a mean lands weeks past where most people buy), shows p25/p75 as the
window most repeat buying falls in, and renders the seven buckets as proportional bars.
The bucket containing the median is emphasised.

**Neither page offers a "push to Klaviyo" button.** Writing a segment to an external
marketing platform is an outbound mutation under root Rule 2's scope tension and needs its
own sign-off; these pages stop at the analysis.

## Acceptance Criteria

- [x] `/customers` gains a persistent three-tab shell; the existing page is unchanged.
- [x] `/customers/segments` shows four segments with customers, orders, revenue, AOV, discount.
- [x] Guest-order exclusion is stated on the page.
- [x] `/customers/repeat-clock` leads with the median and shows p25/p75 and seven buckets.
- [x] The bucket containing the median is visually emphasised.
- [x] No Klaviyo write action anywhere.
- [x] Empty states on both when there is nothing to measure.
- [x] Tokens only; no entrance animation (Rule 9).
- [x] `npm test` green (tab model units); `tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Three tabs; active underline moves; existing Money Finder still works.
- [ ] Discount-only segment visibly shows discount exceeding revenue.
- [ ] Median bucket highlighted on the clock.
- [ ] Light and dark themes both legible.
