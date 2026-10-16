# SPEC-393 — Marketplace connections screen

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-413 · **Plan:** backend
SPEC-391 (OS-5)

## What

Network › Settings gains **Marketplaces** (`features/restaurant/marketplaces-panel.tsx`):

- **Connect** (`network.manage`): branch, marketplace (DoorDash, Uber Eats, Grubhub, other), aggregator
  (Deliverect, or the generic format) and the aggregator's location id. The answer shows the **order
  URL** and **menu URL** once, on the site's public proxy (`lib/marketplaces.ts` `absoluteUrl`), each
  with Copy.
- The connections: branch, marketplace, aggregator, the key's last four, Live/Paused, orders received
  and the last one; **Pause/Resume**, **New key** (shows the new URLs once), remove.
- Read `restaurantQueries.marketplaces()`; writes `connectMarketplace`, `setMarketplaceActive`,
  `rotateMarketplace`, `removeMarketplace`, each registered with `network.manage`. The Network doc's
  Settings section describes it.

Marketplace orders need no new screen: they land on the kitchen board and in the order lists with
their marketplace as the source.

## What FOC sees (Rule 12)

Nothing — restaurant brands only.

## Verification (2026-10-16)

`tests/marketplaces.test.ts` (1); registry and role-gate pins updated; `tsc` clean. Backend behaviour:
`tests/test_restaurant_marketplace.py`.
