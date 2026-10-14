# SPEC-047 — Transfer Opportunity Review Page

- **Status:** Implemented
- **Date:** 2026-07-24
- **Backend:** SPEC-041-transfer-review-and-send.md (backend repo).
- **Owner request:** "when I click the sub-page, breadcrumbs appear, the
  sidebar shows the name of the file it generated, the right side shows
  the file, initially the first one is open — send one by one or send
  all collectively."

## Design

### New route `app/(app)/brief/transfers/page.tsx`

A three-part layout matching the owner's description:

1. **Breadcrumb** — "Morning Brief › Transfer Opportunities" (link back to
   `/brief`).
2. **Sidebar** (left) — one row per destination location: name, dollar
   value, a status chip (`Pending` / `✓ Sent hh:mm`). The first
   not-yet-sent location is selected by default on load (falls back to
   the first item overall if every location is already sent).
3. **Detail panel** (right) — the selected location's full sheet: item
   table (product, units, from-location, weekly velocity, value) exactly
   matching the email body the backend would send, plus that location's
   own **Send this sheet** button (disabled + relabeled "Sent" once sent).

Top action bar: **Send All Remaining** (primary, disabled when nothing is
pending) sends every not-yet-sent location in one combined email per
SPEC-041; a per-location send in the detail panel sends just that one.

### Data flow

- `getTransferSheets()` — `GET /api/proxy/brief/transfers` (RSC fetch).
- `"use client"` island for selection state + the two send actions
  (`POST /api/proxy/brief/transfers/send`), optimistic UI update on
  success (mark sent, keep other panels untouched), inline error on
  failure — same resilience pattern as `decision-card.tsx`.
- No polling; a manual refresh (or navigating back to `/brief` and
  returning) picks up state from other tabs/sessions.

### Brief page change

The `transfer_opportunity` decision card's primary action changes from
the instant no-op "Approve transfer ✓" to a **"Review & Send →"** link to
`/brief/transfers` — this decision requires picking per-destination
content, unlike its siblings which fire a single well-defined action.
`unfulfilled_48h` and `dormant_vips` cards are unchanged.

## Tests (Rule 4)

`tests/order-filters.test.ts`-style unit coverage is not applicable here
(no pure logic module beyond simple selection state); ships with the
manual verification checklist below, per the frontend's no-jsdom-runner
convention (root Rule 4 exception, documented in this repo's CLAUDE.md).

## Acceptance criteria

- [x] Breadcrumb, sidebar with generated sheet names, right-panel preview,
      first pending item open by default.
- [x] Both send-one and send-all-remaining are reachable and correct.
- [x] Already-sent locations show their sent state and cannot be re-sent.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Brief → transfer card → "Review & Send" opens the new page with the
      first location's sheet visible.
- [ ] Sending one location updates only that sidebar row to "Sent".
- [ ] "Send All Remaining" sends every still-pending location and disables
      itself once none remain.
- [ ] Reloading the page reflects sent state from the backend (not just
      local optimistic state).
- [ ] Keyboard: sidebar rows and both send buttons reachable via Tab.
- [ ] Both themes; 375px (sidebar stacks above detail panel).
