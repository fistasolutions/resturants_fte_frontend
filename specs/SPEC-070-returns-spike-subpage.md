# SPEC-070 — Returns Spike Card Links to a Subpage, Not a Modal

## Problem
SPEC-060 made the dashboard's Returns Spike card open a `Dialog` modal ("Top styles by
return rate") instead of navigating anywhere, per a relayed client ask to avoid losing
dashboard context. That broke this app's actual navigation convention: every other
drill-down (Dead Inventory Alerts, Overdue/Transfer review, Order detail) is a real
subpage with a breadcrumb trail, not a modal. Direct owner instruction: reverse SPEC-060,
make Returns Spike consistent with every other card — a subpage at `/orders/returns-spike`.

## Solution
- **Delete the modal.** Remove `features/dashboard/returns-spike-modal.tsx` entirely —
  its ranked-list markup (rank badge, product name, rate, "Orders" link) moves as-is
  into the new page below rather than being redesigned.
- **New route `app/(app)/orders/returns-spike/page.tsx`** (Server Component, same
  fetch-on-server pattern as `app/(app)/inventory/dead-inventory-alerts/page.tsx`):
  breadcrumb `Orders → Returns Spike` (`Orders` links to `/orders`, matching the
  Dead Inventory Alerts page's `Inventory Analyst →` pattern), page title + one-line
  description, then the ranked list (up to 25 — the backend's max, since a full page
  can show more than a quick-peek modal could), each row still linking out to the
  existing filtered `/orders?product=...` view via the existing `returnsSpikeHref()`
  (SPEC-059, untouched). Empty state: "No return spikes in the last 30 days." Failed
  fetch: same "Could not load — try refreshing" card as Dead Inventory Alerts uses.
- **`lib/adapters.ts`** — new `adaptReturnsSpikeTop(raw: RawReturnsSpikeItem[]):
  ReturnsSpikeItem[]`, same mapping the modal used to do inline, now a tested adapter
  (matches how every other services/dashboard.ts call is adapted). `ReturnsSpikeItem`
  (`types/analytics.ts`) is unchanged and reused as-is.
- **`services/dashboard.ts`** — new `getReturnsSpikeTop(limit = 25)`, same
  try/catch-returns-null-on-failure pattern as `getDeadInventoryAlerts` (`services/
  analysis.ts`), calling the existing `GET /dashboard/returns-spike-top?limit=` endpoint
  (backend SPEC-054 — no backend change needed, `limit` already bounded `[1, 25]`).
- **`app/(app)/dashboard/page.tsx`** — Returns Spike `AlertCard` drops
  `action={<ReturnsSpikeModal />}`, goes back to the plain `actionLabel="View top
  styles"` / `actionHref="/orders/returns-spike"` form the other three cards already use.
- **`features/dashboard/alert-card.tsx`** — remove the now-unused `action` prop
  (added by SPEC-060 solely for the modal trigger; no caller passes it once the modal
  is gone) — back to `actionLabel`/`actionHref` only, no dead prop left behind.

## Acceptance Criteria
- [ ] Clicking the Returns Spike card's action navigates to `/orders/returns-spike`
      (no modal opens) — breadcrumb reads `Orders → Returns Spike`, `Orders` is a
      working link back to `/orders`
- [ ] Page lists up to 25 styles ranked by return rate descending, matching the
      backend's `GET /dashboard/returns-spike-top` ranking
- [ ] Each row's "Orders" link still lands on `/orders` filtered to that product
      (`returnsSpikeHref`, unchanged behavior from SPEC-059)
- [ ] Empty state (`items: []`) shows "No return spikes in the last 30 days.", not an
      error or a blank page
- [ ] Fetch failure shows a "Could not load — try refreshing" card, not a crash
- [ ] `features/dashboard/returns-spike-modal.tsx` no longer exists; no remaining
      import references it
- [ ] `AlertCard`'s `action` prop is removed; `alert-card.tsx` has no unused prop
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green
- [ ] Manual check in a running browser (both themes): click the card from
      `/dashboard`, confirm the subpage renders, click a row's "Orders" link, confirm
      it lands on the filtered orders list

## Files
- `app/(app)/orders/returns-spike/page.tsx` (new)
- `features/dashboard/returns-spike-modal.tsx` (deleted)
- `features/dashboard/alert-card.tsx` (`action` prop removed)
- `app/(app)/dashboard/page.tsx`
- `lib/adapters.ts` (`adaptReturnsSpikeTop`)
- `services/dashboard.ts` (`getReturnsSpikeTop`)
- `tests/adapters.test.ts` (new `adaptReturnsSpikeTop` coverage)
