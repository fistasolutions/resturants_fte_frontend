# SPEC-247 — Customers → Health: every platform's view of each top customer

**Date:** 2026-09-15 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-253-customer-health.md` (`GET /customers/health`)
Depends on: SPEC-189 (Customers workspace tabs), SPEC-230 (client data cache),
SPEC-232 (persistent shells), SPEC-242 (✦ Explain this)

## Problem (HCI)

The owner's top customers live in four systems. The Customers workspace already
answers "who is due to reorder" and "who is drifting" from Shopify alone; nothing
shows one customer's Shopify spend, Shopify refunds, Loop returns and Gorgias tickets
on one line, and nothing says "stop chasing this one". This tab is that line, with the
verdict and the sentence behind it, sorted so the thing to do today is at the top.

## What this builds

A fourth Customers tab — **Health**, `/customers/health` — in the persistent shell.

```
[ 50 reviewed · $1.6M ] [ 0 open problem ] [ 6 going quiet · $253K ] [ 7 draining · $136K back ] [ 37 healthy ]
Top spenders of the last 12 months. Refunds are Shopify's ledger; Loop and Gorgias are matched on the
customer's email (57% of tickets carry one). Going quiet is the same rule as the winback list.

Customer            Verdict        Spent      Orders   Last order        Refunds          Returns   Tickets
LINKS Organization  Going quiet    $140,819   22       153 d ago · ~10   1 · 0.5%         —         —
                    Last order 153 days ago — usually every 10 days; $140.8K a year going quiet
Gitty Farkas        Draining       $78,268    68       today · ~5        57 · 57%         —         1
                    Sent back 57% of $78.3K (57 refunds) — costs more than it brings
```

- **Summary tiles** in the backend's order (reviewed · open problem · going quiet ·
  draining · healthy); the going-quiet tile carries `at_stake`, the draining tile
  `refunded_by_draining`; each tile carries ✦ Explain this (`get_customer_health`
  recomputes it).
- **Table in the backend's order** (open problem → going quiet → draining → healthy,
  spend desc within each). Verdict badge with the backend tone and the `why` under the
  name — the reasoning is the product.
- **Cells**: Last order = "153 d ago · ~10 d" (days since, usual gap when known);
  Refunds = "57 · 57%"; Returns = "2 (1 open)" or "—"; Tickets = "3 (1 open)" or "—";
  open counts in the warning tone.
- **Coverage line** under the tiles: window, the email-match basis, and the ticket
  email coverage from the backend — never a false "no tickets".
- Empty state: "No orders in the last 12 months."
- Limit: 50 rows (`?limit=` up to 200, from the backend's contract).

## Design (root Rule 9)

Same tokens/classes as the Decisions and Brand tables; badge tones `bad` / `warn` /
`neutral` / `good`; no entrance animation; table scrolls inside its card.

## Scope

- `types/customers.ts` — `CustomerHealthRow`, `CustomerHealthData`.
- `lib/adapters.ts` — `ApiCustomerHealth`, `adaptCustomerHealth`.
- `lib/queries/customers.ts` — `customerPaths.health(limit)`, `customerQueries.health(limit)`;
  `services/customers.ts` — `getCustomerHealth`.
- `lib/customer-tabs.ts` — `{ key: "health", label: "Health", basePath: "/customers/health" }`;
  `features/customers/customers-shell.tsx` header.
- `lib/customer-health.ts` — pure: badge class, tiles, coverage line, cell text. Vitest.
- `features/customers/health-table.tsx`, `health-page-view.tsx`; `app/(app)/customers/health/page.tsx`.
- `tests/customer-health.test.ts`; `tests/customer-tabs.test.ts` (fourth tab);
  `tests/query-registries.test.ts` pins the query.
- `lib/docs/content/customers.ts` — a "Health" section; `updated` bumped.

## Not changed

Money Finder, Segments, Repeat Clock, winback.

## Acceptance criteria

1. `/customers/health` renders the tiles, the coverage line and the table in the
   backend's order with verdict, `why` and the four platform cells.
2. The tab is active on its exact route only.
3. `npm test`, `npx tsc --noEmit`, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

Done 2026-09-15 against the live store (Playwright, 1440 px):

- [x] Tiles 50 reviewed · $1.6M / 0 open problem / 6 going quiet · $252.9K / 7 draining ·
      $136.3K / 37 healthy equal the API summary; coverage line says 57 % of tickets
      carry an email; rows in order (LINKS Organization → … → Gitty Farkas draining,
      "57 · 56.9%" in the destructive tone); a zero tile count renders muted.
- [x] `npm test` 1565 passed, `tsc` clean, `npm run build` green.
- [ ] Both themes; 400 px — same table classes as Decisions; not captured today.
