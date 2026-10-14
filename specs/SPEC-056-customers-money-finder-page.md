# SPEC-056 — Customers: Money Finder Page (Due to Reorder)

- **Status:** Implemented (partial — see backend SPEC-049 for scope)
- **Date:** 2026-07-25
- **Backend:** SPEC-049-customers-money-finder.md.
- **Owner request:** move forward on the V2 proposal's biggest remaining
  gap — a standalone "Customers" page (proposal §4.8) didn't exist; VIP
  winback only lived inside the Brief. First slice: the "Due to reorder"
  segment, which is real and computed (not the dress-lovers/sale-only
  segments — those need a product-category signal that doesn't exist yet,
  see backend spec's explicit scope note).

## Design

### New nav item + route `app/(app)/customers/page.tsx`

Added to `lib/navigation.ts` between "Orders" and "Integrations" (matches
the mockup's placement). Server-driven via `searchParams` (`q`, `page`) —
same convention as `/brief/winback`:

1. **Summary strip** — two cards: "Drifting VIPs" (count + $ value from
   `vip_summary`, links to `/brief/winback` — this page never rebuilds
   that list, only summarizes it) and "Due to reorder" (count).
2. **Search box** — plain GET form, same as winback.
3. **Due-to-reorder table** — customer, email, orders, lifetime spend,
   their own usual gap, days overdue (not "days silent" — this list is
   about being past-due, not dormant).
4. **Export CSV** button — full (unpaginated) list, streamed from the
   backend, same download-link pattern as the Orders CSV export (no JS).
5. Prev/Next pagination, 15/page.

### Data flow

- `lib/customers-filters.ts` (new, pure, unit-tested) —
  `parseCustomersFilters`/`customersPageHref`, same shape as
  `lib/winback-filters.ts` (q + page only — no min-spend/min-silent here,
  since due-to-reorder isn't value-gated).
- `getMoneyFinder(page, limit, q)` in `services/customers.ts`.

## Tests (Rule 4)

- `tests/customers-filters.test.ts` mirrors `tests/winback-filters.test.ts`.

## Acceptance criteria

- [x] `/customers` reachable from the sidebar.
- [x] Summary strip shows real VIP count/value + due-to-reorder count.
- [x] Due-to-reorder table paginated + searchable.
- [x] CSV export works, unpaginated.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Sidebar "Customers" link opens the new page.
- [ ] "Drifting VIPs" card links to `/brief/winback`.
- [ ] Search + pagination behave like the winback page.
- [ ] CSV export downloads and matches the full list.
- [ ] Both themes; 375px responsive.
