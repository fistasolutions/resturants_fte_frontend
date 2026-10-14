# SPEC-062 — Dead Inventory Alerts UI (backend SPEC-056)

## Client request
Per the exact spec relayed by the client: surface cross-location "forgot to put it
on the floor" alerts (style has stock and zero sales at one selling location in the
last 7 days while selling elsewhere) on the Dashboard as a summary, with a full
review page to inspect each flagged style/location and send a one-click (review
first) alert to that location's manager. Settings needs a place to configure each
location's manager email, since it's distinct from the store-wide manager list.

## One-liner placement (per-page)
- **Dashboard:** a summary alert card — styles flagged, total value, link to the
  full review page. Reuses the existing `AlertCard` pattern (warning tone), same
  family as the other three Dashboard alert cards.
- **New review page**, `/inventory/dead-inventory-alerts` (mirrors the
  `/brief/transfers` review-page convention): one card per flagged
  (style, location) pair — title, location, stock, stock value, days idle,
  selling-elsewhere breakdown, size breakdown, ranked, each with its own
  "Send to {location}'s manager" review-before-send button.
- **Settings:** a new "Location Managers" card, parallel to the existing
  store-wide `ManagerEmailsCard`, listing every active location with an editable
  manager-email field.

## API contract (backend SPEC-056, already implemented)
- `GET /analysis/inventory/dead-inventory-alerts` → `DeadInventoryAlerts`
  (`types/analysis.ts`, already defined).
- `POST /analysis/inventory/dead-inventory-alerts/send` — `{product_id,
  location_id}` → `{email_sent, email_error, location_email}`.
- `GET /settings/status` → now includes `location_managers: [{location_id, name,
  manager_email}]`.
- `PUT /settings/locations/{location_id}/manager-email` — `{email}` →
  `{location_id, name, manager_email}`.

## Design
- Design-system tokens only (root Rule 9) — `bg-warning/*` for the alert tone
  (money sitting idle, not a hard error), `text-destructive` reserved for
  already-established error states only. No Framer Motion, no entrance
  animation — cards render in final position immediately.
- Review page follows the established `/brief/transfers` shape: list of cards
  (not a sidebar+detail split, since each alert is already a small, self-contained
  unit — a table row exceeds it in density but a full split-panel is unwarranted
  for single-location-per-alert content), each with an inline send button that
  moves through `idle → sending → sent | error` exactly like `TransferReview`.
- Settings card matches `ManagerEmailsCard`'s shadcn `Card`/`Input`/`Button`
  layout, one row per location instead of a free-form add/remove list (locations
  are fixed, not user-managed).

## Non-goals
- No date-range selector on the review page — the 7-day window is fixed
  server-side (root Rule 8: backend calculates).
- No bulk "send all" — each alert is reviewed and sent individually per the
  client's "review before send" requirement (unlike `/brief/transfers`, which
  explicitly offers "Send All Remaining" for a different, lower-stakes decision
  type).

## Acceptance criteria
- [ ] `getDeadInventoryAlerts()` added to `services/analysis.ts`, following the
  file's existing try/catch-null convention.
- [ ] Dashboard shows a Dead Inventory Alerts `AlertCard` (or an all-clear state
  when `styles_flagged === 0`), linking to the review page.
- [ ] `/inventory/dead-inventory-alerts` review page renders every flagged alert,
  ranked as returned by the API (no client-side re-sorting), each independently
  sendable.
- [ ] Send button reflects `sent`/`sent_at` from the initial payload and updates
  in place after a successful POST, without a full page reload.
- [ ] Settings "Location Managers" card lists every location from
  `location_managers`, editable and saved via the PUT endpoint, with per-row
  save state.
- [ ] `loading.tsx` skeleton for the new review route.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` all green.

## Patches
- 2026-07-29: The standalone `LocationManagersCard` (per-location contacts)
  sat directly under the pre-existing `ManagerEmailsCard` (the store-wide
  broadcast list) as two separate, near-identically-styled Cards — both
  titled around "manager email" with an "add email + Save" form, reading as
  duplicate/competing features rather than two distinct purposes (client
  feedback: "two UI for the manager emails??"). Merged into one
  `ManagerNotificationsCard` (`features/settings/manager-notifications-card.tsx`)
  with a single title/description explaining the split, and the two prior
  components converted to plain inner sections (`ManagerEmailsSection`,
  `LocationManagersSection`) with their own sub-heading clarifying broadcast
  vs. targeted — no functional change to either save flow.
