# SPEC-083 — Inventory Analyst Tabs + Store Transfers Index Page

## Problem
Two follow-ups after SPEC-081 (Store Transfers detail pages):
1. Owner decision: remove the dashboard Location Intelligence cards' "Transfer
   opportunities" link — it's the wrong home. A manager should reach this from
   the Inventory Analyst page, which is what it's actually about.
2. `/inventory` has grown into one long scroll (verdict tiles, Dead Stock,
   Reorder, the warehouse Transfer table, AI commentary, Out-of-stock,
   Overstock, Fast/Slow movers, Inventory-by-location) — the same problem
   Settings had before SPEC-074's tabs. Split it the same way: route-based
   tabs, not a client Tabs widget.
3. Also needed: a proper index page for Store Transfers (SPEC-081 only built
   the per-location detail page, reachable solely via the dashboard link this
   spec removes) — a real page listing every selling location, so "click a
   store" has a home that isn't a dashboard card.

## Solution

### Remove the dashboard entry point
`features/dashboard/location-cards.tsx` — revert to the single "Review orders"
CTA; drop the "Transfer opportunities" link added in SPEC-081.

### Store Transfers index page
`app/(app)/inventory/store-transfers/page.tsx` (new, alongside the existing
`[locationId]/` dynamic route — same coexistence as `/orders/page.tsx` +
`/orders/[id]/`): breadcrumb `Inventory Analyst → Store Transfers`. Fetches
`GET /analysis/inventory/transfer-locations` (backend SPEC-078) for the
location list, then `Promise.all`s `getLocationTransferOpportunities(id)` per
location (bounded — a handful of physical stores, not an unbounded N+1) for a
quick per-store stat (styles available, units available), each linking to its
existing `/inventory/store-transfers/{id}` detail page.

### Inventory Analyst tabs
New `features/inventory/inventory-tabs.tsx` (server component, same
`<Link>`+`aria-current` pattern as `SettingsTabs`/`OrdersTabs`) — six tabs,
each preserving the active date range across a switch (same idea as Orders'
filter-preserving tabs, adapted for a range instead of filters):

| Tab | Route | Content (moved, not duplicated) |
| --- | --- | --- |
| Overview | `/inventory` | Verdict tiles + AI commentary |
| Reorder | `/inventory/reorder` | Reorder Now + Selling-but-out-of-stock |
| Overstock & Movers | `/inventory/overstock-movers` | Dead Stock section (still links to `/inventory/markdown-plan`, unchanged) + Overstock + Fast movers + Slow movers |
| Transfers | `/inventory/transfers` | Existing warehouse→store Transfer table, **plus** a new card linking to the Store Transfers index (store-to-store) — the first time these two transfer concepts sit in one place |
| Dead Inventory | `/inventory/dead-inventory-alerts` (URL unchanged) | Existing content, untouched — only gains the tabs strip above it |
| By Location | `/inventory/by-location` | The plain per-location table |

`/inventory/dead-inventory-alerts` and `/inventory/markdown-plan` keep their
exact URLs — both are linked from elsewhere (dashboard alert card, Results
page, the Dead Stock section) and must keep working (Rule 7).

One shared `features/inventory/inventory-page-content.tsx` (mirrors the
Orders tabs' `OrdersPageContent` pattern from this same session) does the
range resolution + single `getInventoryPanel` fetch + not-available fallback
once; each of the five new/changed route files is a one-line wrapper picking
a `tab`. AI commentary only fetches on the Overview tab now (previously
fetched unconditionally) — a real, if incidental, cost reduction: every other
tab was paying for an LLM call it never rendered.

## Acceptance Criteria
- [ ] Dashboard Location Intelligence cards show only "Review orders" again
- [ ] All six Inventory tabs render the right content, date range persists
      across a tab switch, `aria-current="page"` on the active tab
- [ ] `/inventory/dead-inventory-alerts` and `/inventory/markdown-plan` still
      work at their existing URLs, still reachable from the dashboard/Results
      page/Dead Stock section links that already point at them
- [ ] Store Transfers index page lists every selling location (never the
      warehouse) with a quick stat, each linking to its detail page
- [ ] AI commentary fetches only when the Overview tab renders
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green
- [ ] Manual check in a running browser (both themes): switch tabs with a
      custom date range active, confirm it survives; dashboard cards no
      longer show a transfer link; Store Transfers index → a store → detail

## Files
- `features/dashboard/location-cards.tsx` (CTA removed)
- `features/inventory/inventory-tabs.tsx` (new)
- `features/inventory/inventory-page-content.tsx` (new, shared body)
- `app/(app)/inventory/page.tsx` (thin wrapper, tab="overview")
- `app/(app)/inventory/reorder/page.tsx` (new)
- `app/(app)/inventory/overstock-movers/page.tsx` (new)
- `app/(app)/inventory/transfers/page.tsx` (new)
- `app/(app)/inventory/by-location/page.tsx` (new)
- `app/(app)/inventory/dead-inventory-alerts/page.tsx` (add tabs strip)
- `app/(app)/inventory/store-transfers/page.tsx` (new index)
- `types/analysis.ts` (`TransferEligibleLocation`)
- `services/analysis.ts` (`getTransferEligibleLocations`)
