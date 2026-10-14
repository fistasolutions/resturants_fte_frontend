# SPEC-054 — Orders Review & Send Page

## Problem
The Orders page "Send to manager" button fires a one-click blind email.  
The client needs a **review-first flow** that mirrors Transfer Opportunities and  
Overdue Orders — grouped by location, with per-location or all-at-once sending —  
but driven by the **current Orders page filter** (not hardcoded to >48h).

## Solution
New page `/orders/review` that:
1. Reads filter params from the URL (same set as `/orders`)
2. Fetches orders grouped by location from a new backend endpoint
3. Shows a KPI summary bar + the two-panel review layout
4. Lets the user send one location at a time or all remaining at once
5. Orders page "Send to manager" → Link to `/orders/review?<current filters>`

## Acceptance Criteria
- [ ] `/orders/review?<filters>` loads grouped sheets from backend
- [ ] Top KPI bar: total orders, total value at risk, oldest order age
- [ ] Left rail: location cards with count + value + Pending/Sent badge, sorted by value desc
- [ ] Right panel: orders table (order name, hours old chip, customer, value)
- [ ] "Send this location" button per location; "Send All Remaining" top-right
- [ ] After send, sheet flips Pending → Sent inline (no full page reload)
- [ ] No manager emails configured → inline warning with link to Settings
- [ ] Empty state if no orders match filters
- [ ] Orders page "Send to manager" is now a Link to `/orders/review?<current query>`
- [ ] `type="button"` safety on all buttons inside the component
- [ ] Both themes verified

## Files
- `app/(app)/orders/review/page.tsx` (new RSC)
- `features/orders/orders-review.tsx` (new "use client" two-panel component)
- `app/(app)/orders/page.tsx` (swap Send button → Link)
- `services/orders.ts` (add `getOrdersByLocation`)
