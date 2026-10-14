# SPEC-039 — Orders in the Sidebar + Proper Filter Bar

- **Status:** Implemented
- **Date:** 2026-07-21
- **Owner request (2026-07-21):** "add the Orders link in the sidebar, and on
  the page proper filters added up there." SPEC-038 shipped `/orders` as a
  drill-down reachable only from report links, with chips that could only
  REMOVE filters. Make it a first-class page: sidebar entry + top filter
  controls that can also SET filters.
- **Builds on:** SPEC-038 (orders page), SPEC-018 (nav scope), backend
  SPEC-032 (filter contract) + backend SPEC-026 Patches (`/reports/scopes`
  serves only real locations).

## Design

1. **Sidebar** (`lib/navigation.ts`): new item **Orders** (`ShoppingCart`
   icon) directly after Dashboard — it's raw store data, distinct from the
   analyst pages. No other nav changes (SPEC-018 scope stands).
2. **Filter bar** — new client component `features/orders/filters-bar.tsx`
   rendered at the top of `/orders` beside the existing search form:
   - **Fulfillment** select: All / Unfulfilled / Partially fulfilled /
     Fulfilled.
   - **Location** select: All / Online / unattributed / every location from
     `GET /reports/scopes` (real, non-empty locations only).
   - **Placed** (age) select: Any time / 0–24h / 24–48h / 48h+.
   - Each change commits immediately via `router.replace` to the URL
     (`ordersPageHref`, page resets to 1), inside `useTransition` with the
     selects disabled while pending. URL stays the single source of truth
     and stays shareable.
3. **Page wiring** (`app/(app)/orders/page.tsx`): fetch orders and scopes
   **in parallel** (`Promise.all`, Rule 5). The location display name now
   resolves from scopes (with the `loc_name` URL param as fallback for
   report links). The removable-chips row is replaced by the bar — the
   selects show the active values; the header description keeps the
   summary.
4. `lib/order-filters.ts`: `locationLabel(filters, locations)` helper
   (unit-tested) resolving the display name from scopes → `loc_name` →
   generic fallback.

## Tests (Rule 4)

`tests/order-filters.test.ts` extended for `locationLabel`. All four gates
green. UI manual checklist below.

## Acceptance criteria

- [x] Orders reachable from the sidebar; active state highlights on
      `/orders` only.
- [x] Selecting any combination of the three filters + search updates the
      list, URL, and export link consistently.
- [x] Report drill-down links land with the bar showing their filters.
- [x] Suites, `tsc`, lint, production build green.

## Manual verification checklist

- [ ] Sidebar → Orders shows all orders; set Unfulfilled + Jackson + 48h+ —
      list matches the report table count; Export CSV downloads that slice.
- [ ] Report drill-down link → bar pre-selects the same values.
- [ ] Selects keyboard-operable; pending state disables without layout
      shift; both themes; 375px.
