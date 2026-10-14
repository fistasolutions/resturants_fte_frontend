# SPEC-052 — Winback (Dormant-VIP) Review Page

- **Status:** Implemented
- **Date:** 2026-07-24
- **Backend:** SPEC-046-dormant-vip-personalized-and-review.md (backend
  repo) — new value-percentile + per-customer-relative dormancy logic,
  plus `GET /brief/winback` / `POST /brief/winback/send`.
- **Owner request:** the third and final Brief card to move to the
  review-before-send pattern already shipped for `transfer_opportunity`
  (SPEC-047) and `unfulfilled_48h` (SPEC-049) — this one fires a real
  Klaviyo sync, and the owner agreed a manager should see exactly which
  customers are being flagged before it fires.

## Design

### New route `app/(app)/brief/winback/page.tsx`

Simpler than the other two review pages — there's nothing to split by
destination, it's one flat action (sync everyone in the list to Klaviyo),
so **no sidebar**:

1. **Breadcrumb** — "Morning Brief › Winback List" (link back to `/brief`).
2. **Customer table** — one row per qualifying customer: name, email,
   lifetime orders, lifetime spend, their own average days-between-orders,
   and days silent — the exact numbers behind "top 20% lifetime value, 3+
   orders, silent 2×+ their usual gap."
3. **One primary action** — "Sync to Klaviyo" (disabled + relabeled
   "Synced" once sent today).

### Data flow

- `getWinbackCustomers()` — `GET /api/proxy/brief/winback` (RSC fetch).
- `"use client"` island for the one send action (`POST
  /api/proxy/brief/winback/send`, no body), same resilience pattern as
  `transfer-review.tsx`/`overdue-review.tsx`: wait for the real server
  response, a 409 (already sent) is informational not a scary error.
- Empty-candidates state (0 qualifying customers) renders a plain "nothing
  to review right now" message, same as the other two pages.

### Brief page change

The `dormant_vips` decision card's primary action changes from the instant
"Export list ✓" (which actually fired the Klaviyo sync immediately) to a
**"Review & Send →"** link to `/brief/winback` — the other card content
(headline, evidence, amount) already reflects the new backend logic
(SPEC-046) with no frontend change needed, since the AI never calculates
(root Rule 8) — the frontend only renders what the backend already sent.

## Tests (Rule 4)

Ships with the manual verification checklist below — no new pure-logic
module (same no-jsdom-runner exception SPEC-047/049 already documented).

## Acceptance criteria

- [x] Breadcrumb, customer table with the real per-customer numbers, one
      send action.
- [x] Already-sent-today state shown and re-send blocked.
- [x] `dormant_vips` card no longer fires Klaviyo on approve.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Brief → winback card → "Review & Send" opens the new page with the
      customer table visible.
- [ ] "Sync to Klaviyo" fires once, then disables/relabels itself.
- [ ] Reloading the page reflects sent state from the backend.
- [ ] Empty-candidates state renders cleanly (no qualifying customers).
- [ ] Keyboard: table rows and the send button reachable via Tab.
- [ ] Both themes; 375px responsive (table scrolls horizontally if needed).
