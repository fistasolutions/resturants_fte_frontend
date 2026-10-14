# SPEC-136 — Discounts: Staff & Reasons tabs (+ per-tab skeletons, pagination)

Status: implemented
Depends on: backend SPEC-137 (reasons), SPEC-098 (discount monitoring), SPEC-134 (staff names)

## Problem

The Discount Monitoring workspace had only **Overview** and **Alerts**, and every subtab
inherited the Overview-shaped skeleton (`app/(app)/discounts/loading.tsx`). Now that we
have **staff names** and **reasons**, the owner's WHO/WHY questions deserve first-class
tabs — and the page needs proper per-tab skeletons and pagination.

## Design

Add two value tabs (no duplication of the per-location employee drill):

- **`Staff`** (`/discounts/staff`) — a **company-wide** manual-discount leaderboard (WHO).
  Reuses the existing `/discounts/employees` endpoint (company-wide when `location_id` is
  omitted) — no new backend. Client component with **pagination** (10/page; the set is
  bounded ~dozens), outlier flag, real names (SPEC-134), links to each staff drill-down.
- **`Reasons`** (`/discounts/reasons`) — the **WHY** breakdown from backend SPEC-137:
  each reason's $ + orders as a ranked bar list, a prominent **"no reason" %** card that
  makes the case for a POS reason prompt.

Wiring:
- `lib/discount-tabs.ts`: `DiscountTab` gains `"staff" | "reasons"`; `DISCOUNT_TABS` +
  routes; shell `TAB_DESCRIPTION` gains both (the record is exhaustive — tsc-checked).
- `services/discounts.ts` + `types/discounts.ts`: `getDiscountReasons` + `DiscountReasons`.
- **Per-tab skeletons:** dedicated `loading.tsx` for `staff`, `reasons`, and **`alerts`**
  (fixing the shape mismatch where Alerts showed the Overview skeleton).

HCI/perf: skeletons match each tab's real shape; pagination keeps DOM light; tokens only,
no entrance animation (Rule 9); keyboard-navigable rows; empty/loading/error states.

## Manual verification checklist

- Tab bar shows Overview · Staff · Reasons · Alerts; date range carries across tabs.
- Staff: paginated leaderboard, real names, outliers flagged, rows drill to the employee.
- Reasons: ranked reason bars + a "no reason" % card; empty state when no manual discounts.
- Each tab flashes its OWN shaped skeleton on switch (not the Overview one).
- Light + dark, desktop + mobile (tables scroll), keyboard focus intact.

## Acceptance Criteria

- [x] Staff + Reasons tabs added; Staff paginated + company-wide (reuses `/employees`).
- [x] Reasons binds to backend SPEC-137 with a "no reason %" call-to-action.
- [x] Per-tab `loading.tsx` for staff/reasons/alerts (correct shapes).
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.
