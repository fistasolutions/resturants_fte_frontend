# SPEC-008 — Sidebar Store Switcher Dropdown

**Status:** Implemented
**Phase:** 1 — Frontend Foundation
**Governing docs:** ../docs/prd.md (V1 = one store; multi-store = Coming Soon),
../docs/Architecture.md §12, root CLAUDE.md Rule 2 (never block future multi-store)

## Goal

The sidebar "Connected Store" block becomes an interactive **store switcher dropdown**
(owner request, 2026-07-15): it lists the connected store (selected), and an
"Add another store" action that is visibly **Coming soon** — the UI is multi-store-ready
while V1 keeps exactly one store.

## Scope

- Replace the static store block in `components/layout/app-sidebar.tsx` with a
  shadcn `DropdownMenu`:
  - **Trigger** — same visual as today (status icon tile, domain, Active/Disconnected
    badge) plus a `ChevronsUpDown` affordance; keyboard/focus states from shadcn.
  - **Menu** — label "Connected store"; one item per connected store (V1: one) showing
    domain + `Check` mark on the selected store; separator; **"Add another store"**
    item with `Plus` icon, `disabled` + `aria-disabled`, trailing "Coming soon" badge
    (consistent with the nav's coming-soon pattern).
- Data still flows from `services/store.getStoreConnection()` (single store). When
  multi-store ships, the service returns a list and this menu maps over it — no
  structural change.

## Out of scope

Actual store switching/adding (Coming Soon per PRD), any header changes (the
period/compare dropdowns are a later spec with data wiring).

## Acceptance Criteria

1. Clicking the store block opens the menu; the connected store shows a check;
   "Add another store" is disabled with a visible "Coming soon" badge.
2. Fully keyboard-operable (Enter/Space opens, arrows navigate, Escape closes).
3. Trigger still shows domain + Active status at rest; disconnected state renders too.
4. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Open/close via mouse and keyboard; focus returns to trigger on close.
- [ ] "Add another store" not activatable; badge readable.
## Patches

- 2026-07-15 — Superseded placement: the store switcher moved from the sidebar to the dashboard header (owner request). See SPEC-009-header-controls.md. Menu behavior unchanged.
