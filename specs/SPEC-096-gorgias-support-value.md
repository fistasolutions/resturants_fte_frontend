# SPEC-096 — Gorgias support-value UI (Revenue-at-risk + Contact rate)

**Status:** ✅ shipped 2026-08-06 (see Patches). Frontend for backend SPEC-098 — surfaces the two
cross-system insights in the existing Team Performance workspace. Pure consumer
of the API (Rule 8, no calculations in the UI); tokens only, both themes, no
entrance animation (Rule 9).

## Where each lands in the UI

**① Revenue at risk**
- **Alerts tab** (`/team-performance/alerts`): a new lead section **above**
  "Unanswered" — a headline card (total $ at risk + at-risk customer count) and
  a ranked `RevenueAtRiskTable` of the top customers (name, lifetime value, their
  waiting/unhappy ticket subject + reason + age, a `risk_kind` badge, link to the
  conversation). Empty → "all clear" state like the other alert sections.
- **Overview tab** (`/team-performance`): a compact `OverviewRevenueAtRisk` card
  in the alerts row, linking to the Alerts tab.

**② Contact rate + driver mix**
- **Overview tab**: an `OverviewContactRate` card directly under the KPI hero —
  "X per 100 orders" (contact_rate × 100) with a vs-previous-period delta
  (lower = good) and the denominator subtext ("N conversations across M orders").
  The existing `OverviewBreakdowns` "Top contact reasons" gains a per-reason
  **share of total %** (the driver mix), alongside the existing bar.

## Type changes (additive)

- `GorgiasOverviewMetrics`: add `orders: number`, `contact_rate: number | null`.
- `GorgiasOverview`: add `revenue_at_risk: { total: number; customer_count: number }`.
- `GorgiasAlerts`: add `revenue_at_risk: RevenueAtRisk`.
- New `RevenueAtRiskCustomer` (customer_name, total_spent, gorgias_ticket_id,
  subject, contact_reason, status, created_at, risk_kind, gorgias_url) and
  `RevenueAtRisk` ({ total, customer_count, customers[] }).

## Components

- `features/team-performance/overview-contact-rate.tsx` — contact-rate card.
- `features/team-performance/overview-revenue-at-risk.tsx` — compact overview card.
- `features/team-performance/revenue-at-risk-table.tsx` — ranked at-risk table
  (row = stretched link to the conversation detail, same pattern as
  `LeaderboardTable`). A `risk_kind` → label/tone map (unanswered=destructive,
  over_24h=warning, unhappy=destructive).
- New pure helper `lib/contact-rate.ts` (`perHundred(rate)`) + `lib/ticket-age.ts`
  (`ticketAge(createdISO, nowISO)` → "3d 4h" style) — both unit-tested (Vitest).

## Labels (honesty — Rule 8 / product boundary)

- Revenue at risk: *"Lifetime value of customers with an open or unhappy
  conversation right now"* — an association, not predicted lost revenue.
- Contact rate: *"Support contacts per 100 orders — lower is healthier."*

## Acceptance criteria

1. Overview shows contact rate per 100 orders with a correctly-colored delta
   (down = good) and the conversations/orders denominator; "—" when orders = 0.
2. Alerts shows the revenue-at-risk headline + ranked table; empty state when
   none; each row links to the conversation and shows LTV, reason, age, risk badge.
3. Overview revenue-at-risk card shows total + count and links to Alerts.
4. Driver-mix reasons show share-of-total %.
5. `perHundred` + `ticketAge` unit-tested; `tsc`, `lint`, full Vitest, and
   `next build` all green; verified in light + dark; no entrance animation.

## Manual verification checklist (no jsdom runner yet — root Rule 4)

- [ ] `/team-performance` — contact-rate card renders under KPIs, delta color
      correct, denominator present; revenue-at-risk card links to Alerts.
- [ ] `/team-performance/alerts` — revenue-at-risk section leads, table ranked by
      LTV desc, risk badges correct, rows link through; empty state when zero.
- [ ] Both themes; keyboard-focusable rows; responsive at mobile/tablet/desktop.

## Patches

- 2026-08-06 — **Shipped.** Types extended (`orders`, `contact_rate`,
  `revenue_at_risk` on overview; `GorgiasRevenueAtRisk`/`…Customer` +
  `revenue_at_risk` on alerts). New components `overview-contact-rate.tsx`,
  `overview-revenue-at-risk.tsx`, `revenue-at-risk-table.tsx`; Overview page shows
  a contact-rate + revenue-at-risk card row under the KPIs; Alerts page leads with
  the ranked revenue-at-risk section; `overview-breakdowns` gained share-of-total
  %. New pure helpers `lib/contact-rate.ts` + `lib/ticket-age.ts` (6 vitest cases).
  Tokens only, both themes, no entrance animation; rows are stretched links.
  `tsc` + `lint` + 321 tests + `next build` all green.
