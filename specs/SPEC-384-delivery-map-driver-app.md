# SPEC-384 — Delivery maps: zones, dispatch map and runs, the driver app, the guest's live map

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-400 · **Builds on:**
SPEC-379/380 (Restaurant OS screens), SPEC-358 (role gates), SPEC-229 (docs)

## Why

Delivery is run on a map: where a branch delivers, where every ready order and driver is, which
orders go together, and — for the guest — where the driver is now.

## The map

One client component, `features/restaurant-os/geo-map.tsx`, over **Leaflet 1.9** (`leaflet`, loaded
in the browser only) with raster tiles from `NEXT_PUBLIC_MAP_TILE_URL` (default OpenStreetMap, its
attribution always shown; a production brand sets its own tile provider). It draws polygons (zones),
markers (branch, orders, drivers, the guest's home) as `divIcon`s styled with tokens — no image
assets — and reports clicks for drawing. Pure helpers in `lib/geo-map.ts`: bounds and centre,
distance formatting, drawing (add/undo/clear corners), the navigation link
(`https://www.google.com/maps/dir/?api=1&destination=lat,lng`), and the location-report throttle.

## Screens

- **Network › branch page › Delivery zones** (under Service): the map centred on the branch with its
  zones; **Draw a zone** (click corners, Undo, Clear, name, fee, minimum, extra minutes, **Save** on
  `branch.manage`); per zone: on/off and delete (`branch.manage`). A branch without coordinates is
  told to add them (Edit branch). While no zone is drawn, the branch's postal codes rule.
- **Kitchen & Dispatch › Dispatch**: a map of the branch, ready deliveries (numbered) and drivers'
  last positions; **Suggested runs** — each run's orders in driving order and its kilometres, with a
  driver picker and **Send together** (`kitchen.operate`). Single sends stay.
- **Kitchen & Dispatch › Drivers**: **Driver link** issues the driver's app link, shown once with
  **Copy** (issuing again replaces it); **Revoke**; each driver's last position time.
- **Driver app** (`/driver/[token]`, public, added to the proxy's open routes): the driver's run in
  order — number, first name, address, notes, items, amount to collect — **Navigate** (opens the
  phone's maps), **Call**, **Delivered** (or **Paid cash / Paid card** when money is owed);
  **Share my location** (the phone's GPS, reported at most every 15 seconds while the page is open);
  Available / Off shift; refreshes every 15 seconds.
- **Online ordering**: for delivery, **Use my location** (the device's position) finds the branches
  whose zones hold it; at checkout a small map shows the delivery area and the pin, which a tap
  moves; the order carries the point.
- **Tracker**: while out for delivery, a map with the driver and the guest's home, refreshing every 10
  seconds.

## Rules kept

Writes in `services/restaurant-os-actions.ts` (`createZone`, `updateZone`, `deleteZone`,
`issueDriverLink`, `revokeDriverLink`, `dispatchRun`) and the public `services/driver-app-actions.ts`
(`reportDriverLocation`, `markDeliveredByDriver`, `setDriverAvailability`), each in
`lib/action-permissions.ts`; reads `restaurantQueries.zones`, `restaurantQueries.batches`,
`storefrontQueries.driver`; tokens only (Leaflet's own paths styled through classes); docs: Kitchen &
Dispatch and Network updated.

## What FOC sees (Rule 12)

Unchanged — restaurant screens only.

## Acceptance criteria

1. Every write gated by role; registries, docs and nav tests pass; `lib/geo-map.ts` unit-tested.
2. `npm test`, `npx tsc --noEmit`, `npm run build` pass.
3. Manual against a local backend: draw a zone; order online from inside it; see suggested runs and
   send two orders together; open the driver link, share a location, mark delivered; see the driver
   on the tracker.

## Verification (2026-10-16)

AC 1 done (`tests/geo-map.test.ts`, role-gate coverage, registries, docs) · 2 done (2,747 tests,
`npx tsc --noEmit`, `npm run build`) · 3 done against a local demo in Manhattan: a drawn zone on the
branch page; the dispatch map with three ready orders and a suggested run sent together from the UI;
the driver app on a phone-sized screen (map, stops in order, Navigate, Call, collect); the tracker with
the driver and the guest's door. Drawing a zone by clicking was exercised through its pure helpers and
the panel's render, not by clicking corners in the browser.
