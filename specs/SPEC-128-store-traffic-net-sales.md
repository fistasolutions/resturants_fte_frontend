# SPEC-128 — Store Traffic: net sales, tax transparency & profit-per-visitor (UI)

Status: implemented
Depends on: backend SPEC-131, SPEC-101/112 (Store Traffic UI)

## Problem

The client asked for **net sales** (ex-tax) so stores that collect tax compare fairly
with stores that don't. The backend (SPEC-131) now returns net `sales` plus
`gross_sales`, `tax_collected`, and profit fields. The UI must present net as the money
figure, make the gross → tax → net story legible, and surface profit-per-visitor when
COGS coverage allows — all within the existing design system (Rule 9).

## Design

**Types (`types/traffic.ts`)** — additive on `TrafficTotals`, `TrafficByStore`, and the
store-detail totals: `gross_sales`, `tax_collected`, `gross_profit`,
`profit_per_visitor`, `profit_margin`, `cogs_coverage`.

**Store League (`store-league-view.tsx`)**
- The **Sales** column becomes **Net sales** with an ⓘ affordance: "Net of sales tax —
  so stores that collect tax compare fairly with those that don't." Value is net; a
  per-cell tooltip shows `Gross $X − Tax $Y = Net $Z`.
- New muted **Tax collected** column, so Jackson's `$0` reads as expected, not missing.
- **Value per visitor** tile/column is now net (unchanged wiring; clarified in the ⓘ).
- New **Profit / visitor** tile + column, shown only when `profit_per_visitor != null`
  (coverage ≥ 70%); otherwise a subtle "Add product costs to unlock profit/visitor" hint.
- Ranking logic unchanged (conversion-first); the numbers it shows are now net.

**Overview + Store detail (`store-traffic-view.tsx`, `store-detail-view.tsx`)**
- The sales/value-per-visitor KPIs render net; add a small `Gross − Tax = Net` caption
  and a Profit-per-visitor stat when available.

**Lost-Sales (`lost-sales-view.tsx`)** — the opportunity is now in net dollars; add a
one-line "figures are net of tax" note so the $ is unambiguous.

All money via `formatCurrency`; tokens only; no new deps; no entrance animation.

## Manual verification checklist (no jsdom runner)

- League "Net sales" ⓘ + per-cell `Gross − Tax = Net` tooltip render; Tax-collected
  column shows `$0.00` for the non-taxed store.
- Value-per-visitor reflects the net drop (taxed stores lower than before).
- Profit/visitor tile + column appear when coverage ≥ 70%, hidden with the hint otherwise.
- Both light & dark themes; desktop + mobile (table scrolls); keyboard focus intact.

## Acceptance Criteria

- [x] Net sales is the money figure everywhere on Store Traffic; gross/tax visible.
- [x] Tax-collected column present; profit/visitor gated on coverage with an honest empty state.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.
