# SPEC-098 — Discount Monitoring (loss-prevention) — frontend

**Status:** ✅ shipped 2026-08-06 (see Patches). UI for backend SPEC-099. Pure API consumer (no calculations,
Rule 8); persistent tab shell (like SPEC-097/094); tokens only, both themes, no entrance
animation (Rule 9). New nav item **"Discounts"** with the shared dashboard date filter.

## The drill path (the client's explicit ask: Company → Location → Employee → Transaction → Item)

- **`/discounts` (Overview)** — company KPIs (gross, discount $, % of gross, # discounted
  orders, avg) + the **automatic vs manual vs code** split, a **per-location** table
  (ranked by discount load, each row → drills in), an **alerts strip** (red/yellow), and
  an **Automatic promotions** breakdown. Green/Yellow/Red header signal.
- **`/discounts/locations/[locationId]`** — that location's manual-discount **employee
  leaderboard** (# discounts, $, avg, max, % of their orders discounted, outlier badge);
  row → employee.
- **`/discounts/employees/[staffUserId]`** — that employee's **discounted transactions**
  (date/time, location, device, order #, customer, original→final, discount $/%, label);
  row → transaction.
- **`/discounts/transactions/[orderId]`** — one transaction + its **discounted items**
  (product, SKU, original, final, discount $/%).
- **`/discounts/alerts`** — flagged transactions & employees, red/yellow.
- **Staff mapping** — an "unmapped staff" banner (reuse the Gorgias pattern) to name raw
  `user_id`s; `PUT /discounts/staff/{id}`.

## Honesty in the UI (Rule 8 / product boundary)

- No "manager approved" column — the R/Y/G is **policy-based** (thresholds + outliers),
  labeled *"flagged by policy, not a manager-approval record."*
- Discount reason shown as-is with a **"reason not captured"** state when it's the
  Shopify default; a one-line note that a POS reason prompt would populate it.

## Components / services

- `services/discounts.ts` — typed `serverApi` calls for each endpoint.
- `types/discounts.ts` — response models.
- `features/discounts/*` — overview KPIs, type-split card, location table, employee table,
  transactions table, items table, alerts, unmapped-staff banner; a shared `RiskBadge`
  and `SignalDot` (green/yellow/red).
- `app/(app)/discounts/{layout,page,loading}.tsx` + the four drill routes.
- New pure helper `lib/discount-share.ts` (share/percentage formatting) — unit-tested.

## Acceptance criteria

1. Full drill Company → Location → Employee → Transaction → Item works; every level is a
   real route (URL is truth; reload-safe; back button works).
2. Overview shows the automatic/manual/code split, per-location table, alerts, and
   automatic promos; header R/Y/G reflects the worst active alert.
3. Employee views show outlier badges; unmapped staff show the raw id and can be named.
4. Honest labels present (no approval stamp; reason-not-captured state).
5. `tsc`, `lint`, full Vitest, `next build` green; both themes; no entrance animation.

## Manual verification checklist (no jsdom runner)

- [ ] `/discounts` renders KPIs + split + location table + alerts; date filter scopes all.
- [ ] Drill through to a single item; back navigation preserved.
- [ ] Name an unmapped staff → persists; employee view shows the name.
- [ ] Both themes; keyboard-navigable rows; responsive.

## Patches

- 2026-08-06 — **Shipped.** Nav item "Discounts" (BadgePercent). Persistent
  shell (`discounts-shell.tsx` + `discount-tabs.tsx` + `layout.tsx`) with the
  dashboard date filter; Overview + Alerts tabs; drill routes
  `locations/[locationId]`, `employees/[staffUserId]`, `transactions/[orderId]`
  render bare with a breadcrumb (Company → Location → Employee → Transaction →
  Item). Components: overview KPIs + type split + signal badge, location table,
  promotions card, employee table (outlier badge), transactions table,
  transaction detail (applications + items), alerts list (reason badges),
  unmapped-staff banner (name mapping via proxy PUT). Honest labels: policy
  signal not manager approval; "reason not captured" state. New pure helpers
  `lib/discount-share.ts` + `lib/discount-tabs.ts` (3 vitest cases). tsc + lint +
  326 tests + `next build` (all 5 routes) green; tokens only, both themes, no
  entrance animation.
