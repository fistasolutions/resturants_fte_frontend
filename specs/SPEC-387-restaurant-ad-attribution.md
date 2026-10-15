# SPEC-387 — Paid Ads for restaurants: tracked orders and branch campaigns

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-404 · **Plan:** backend
SPEC-401 (W4)

## Why

A restaurant brand's ads are judged on the brand's own online orders. The site must keep the ad's
tokens until the guest orders, and the Paid Ads screens must let the brand aim a campaign at a branch
and give it the link to use.

## The site

- `lib/attribution.ts` (pure): `readAttribution` (the `utm_source`, `utm_medium`, `utm_campaign` of a
  query string, trimmed, lower-cased, cut to 80/80/120), `attributionQuery` (to carry them onward),
  `attributionBody`, and the session-storage round trip.
- `/order/<slug>` remembers the landing URL's tokens for the visit
  (`features/storefront/attribution-store.ts`, `sessionStorage` per brand, wrapped in try/catch) and
  sends them as the order's `attribution`. `orderBody` sends `attribution: null` otherwise.
- A local page (`/r/<slug>/<page>`, SPEC-386) passes its tokens on to its Order online links.

## Paid Ads

- **New campaign** (restaurant brands only): a **Branch** select — every open branch, or "Every branch
  (brand campaign)" — sent as `branch_id`; the placeholders speak about food.
- **Campaign card**: for a restaurant brand, the branch name, the branch's net sales and orders since
  launch with the change on the same number of days before (`GET /ads/campaigns/{id}/branch-lift`,
  `lib/branch-lift.ts` words it), and the **Ad link** with Copy.
- Shops see no change: the new campaign fields are optional and absent for them.

## What FOC sees (Rule 12)

Unchanged — the branch field and panel appear only with the `restaurant` feature; a shop's campaign
payload carries none of the new fields.

## Acceptance criteria

1. An order placed after landing with `utm_*` carries them; later pages in the visit keep them.
2. A restaurant brand creates a branch campaign; its card shows the branch, the lift and the ad link.
3. Unit tests for `lib/attribution.ts`, `lib/branch-lift.ts` and the order body.

The Paid Ads header says "grounded in your branches' own online orders" for a restaurant brand ("your
Shopify data" otherwise), and the Ads doc describes both.

## Verification (2026-10-16)

`tests/attribution.test.ts` (4): AC 3 done. Full suite 2760 passed, `tsc` clean, lint 0 errors, build
green. Manual on the demo: AC 2 done (a branch campaign for #101 shows the branch, "−3% on the 14 days
before" and the ad link to the published local page, with Copy) · AC 1 done for the hand-off (the local
page's Order online links carry the tokens; the storefront keeps them for the visit and sends them with
the order — covered by the order-body test and the backend's attribution test).
