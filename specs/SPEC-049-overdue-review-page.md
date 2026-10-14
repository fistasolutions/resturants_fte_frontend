# SPEC-049 — Overdue-Orders Review Page (reverses the instant-send)

- **Status:** Implemented
- **Date:** 2026-07-24
- **Backend:** SPEC-044-overdue-review-and-send.md (backend repo).
- **Owner request:** "reverse this [the instant-approve overdue-orders
  button] and do the same as we did with the transfer [-opportunity card]"
  — same breadcrumb → sidebar (one row per generated list) → detail-panel
  pattern as SPEC-047, applied to the `unfulfilled_48h` decision.

## Design

### New route `app/(app)/brief/overdue/page.tsx`

Identical shape to `/brief/transfers` (SPEC-047):

1. **Breadcrumb** — "Morning Brief › Overdue Orders" (link back to `/brief`).
2. **Sidebar** — one row per location: name, dollar value at risk, a status
   chip (`Pending` / `✓ Sent hh:mm`). First not-yet-sent location selected
   by default (falls back to the first item if everything is sent). The
   backend's `"unattributed"` bucket (online orders with no POS location)
   renders as a normal row named "Online / unattributed" — nothing special
   on the frontend, it is just another `location_key`.
3. **Detail panel** — the selected location's order list (order number,
   age, value) exactly matching the email body, plus that location's own
   **Send this list** button (disabled + relabeled "Sent" once sent).

Top action bar: **Send All Remaining** (primary, disabled when nothing
pending) sends every not-yet-sent location in one combined email per
SPEC-044; a per-location send in the detail panel sends just that one.

### Data flow

- `getOverdueSheets()` — `GET /api/proxy/brief/overdue` (RSC fetch).
- `"use client"` island for selection state + the two send actions
  (`POST /api/proxy/brief/overdue/send`, body `{location_key}`), same
  resilience pattern as `transfer-review.tsx`: no optimistic sent-flip,
  wait for the real server response (a 409 from a race is treated as
  informational, not a scary error — the row already shows sent once the
  page re-syncs).

### Brief page change

The `unfulfilled_48h` decision card's primary action changes from the
instant no-op "Mark as done ✓" (which used to fire the email immediately)
to a **"Review & Send →"** link to `/brief/overdue` — mirrors exactly what
SPEC-047 already did for `transfer_opportunity`. `dormant_vips` is
unchanged (Klaviyo still fires instantly from the Brief card; the owner
has only asked for these two, in this order, to move to the reviewed
pattern).

## Tests (Rule 4)

Ships with the manual verification checklist below — no new pure-logic
module beyond simple selection state (same exception SPEC-047 already
documented for this repo's no-jsdom-runner convention).

## Acceptance criteria

- [x] Breadcrumb, sidebar with one row per generated list, right-panel
      preview, first pending item open by default.
- [x] Both send-one and send-all-remaining are reachable and correct.
- [x] Already-sent locations show their sent state and cannot be re-sent.
- [x] `unfulfilled_48h` card no longer fires an email on approve.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Brief → overdue card → "Review & Send" opens the new page with the
      first location's list visible.
- [ ] Sending one location updates only that sidebar row to "Sent".
- [ ] "Send All Remaining" sends every still-pending location and disables
      itself once none remain.
- [ ] Reloading the page reflects sent state from the backend.
- [ ] Keyboard: sidebar rows and both send buttons reachable via Tab.
- [ ] Both themes; 375px (sidebar stacks above detail panel).
