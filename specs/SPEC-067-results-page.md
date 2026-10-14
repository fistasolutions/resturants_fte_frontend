# SPEC-067 — `/results` Page

## Problem
Every send action in the app (Overdue, Transfers, Winback, Dead Inventory, Orders) now
has a real backend verdict behind it (backend SPEC-063, `GET /results`), but there's
nowhere in the UI to see it. This ships that one page.

## Solution
- **New top-level sidebar item, "Results"** — its own route (`/results`), not a
  sub-tab under Morning Brief. It answers for all 5 send types, three of which
  (Transfers, Dead Inventory, Orders) aren't Brief pages at all — nesting it under
  `/brief/` would misrepresent its scope.
- **Server Component page** (`app/(app)/results/page.tsx`) fetches `GET /results`
  once via `serverApi`, passes the whole payload to a client tab-switcher.
- **Tabs**: Overdue, Transfers, Winback, Dead Inventory, Orders — a small client
  component (`features/results/results-tabs.tsx`) with local `useState` for the
  active tab; no new shadcn dependency needed for 5 plain buttons switching which
  already-fetched array renders (no shadcn `Tabs` primitive installed yet, and
  installing one for a single-page five-button switch is more than this needs).
- **Each row**: headline, meta ("Sent Jul 29, 7:02 AM"), a verdict badge (✓ Worked /
  → Too early to tell / ✗ No change — color-coded success/warning/muted, same
  semantic tokens as every other status badge in this app), the detail sentence, and
  a link built from the entry's typed `link` field:
  - `{type: "orders", location_key}` → `ordersPageHref({ location: location_key })`
  - `{type: "inventory", location_key}` → `/inventory` (location-scoped view doesn't
    exist yet at the location-key granularity; links to the Inventory Analyst page)
  - `{type: "dead_inventory", product_id, location_id}` →
    `/inventory/dead-inventory-alerts/{product_id}/{location_id}` (SPEC-064's own
    detail route)
  - `{type: "customers"}` → `/customers`
- **Empty state per tab**: "No sends yet" — not an error, not a fake row.
- **No entrance animation** (root Rule 9): tab switch is instant, content already
  fetched, just toggling which array renders.

## Acceptance Criteria
- [ ] "Results" appears in the sidebar (own route, own nav item, not nested)
- [ ] All 5 tabs render real data from `GET /results`; switching tabs never refetches
- [ ] Verdict badges use only semantic tokens (success/warning/muted), matching this
      app's existing badge conventions
- [ ] Each entry's link resolves to a real, correct destination per its `link.type`
- [ ] Empty tabs show a plain "No sends yet" message, not an empty box or a crash
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green
- [ ] Manual check in a running browser against real data, both themes

## Files
- `app/(app)/results/page.tsx` (new)
- `features/results/results-tabs.tsx` (new)
- `types/results.ts` (new)
- `lib/adapters.ts` (raw shape + adapter)
- `services/results.ts` (new)
- `lib/navigation.ts` (new nav item)
