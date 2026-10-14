# SPEC-329 — Digital Employees opens in the sidebar

**Status:** implemented · **Date:** 2026-10-01 · **Repo:** frontend only · **Builds on:**
`SPEC-290-digital-employees-hub.md`, SPEC-296 (Finance Oversight under `/employees/finance`),
SPEC-315 (progressive disclosure)

## Why

Since SPEC-290 the five AI employees are reached only through the hub page: the sidebar
draws one "Digital Employees" row. The owner asked (2026-10-01) for that row to carry a
chevron that opens the employees right in the sidebar, so any of them is one click away
from every page.

## What

- The Digital Employees row gets a chevron on its right. Clicking the chevron opens or
  closes a sub-list. Clicking the row itself still goes to `/employees` and also opens the
  list.
- The sub-list holds the five employees in the hub's roster order (backend
  `services/employees/roster.py` `EMPLOYEES`): **Spotlight** `/spotlight`, **Social
  Growth** `/social`, **Performance Ads** `/ads`, **Finance Oversight**
  `/employees/finance`, **Report FTE** `/report-fte`. Each is a link, with its icon.
- The list is open while the owner is inside the hub or any employee (the same rule that
  lights the row, `isSidebarItemActive`); the employee being viewed is highlighted. Elsewhere
  it starts closed. A chevron click overrides that until the next page load.
- The list follows progressive disclosure exactly like the sidebar (SPEC-315
  `visibleItems`, keyed by `pageKey` — so Finance is `finance`): an employee the workspace
  hides for any reason, including `not_connected` (Finance before QuickBooks), is not listed.
  A hub with nothing to list shows no chevron.
- Collapsed (icon) sidebar: no chevron, no list (shadcn hides both); the row behaves as
  before. On mobile a sub-item click closes the sheet like every other link.
- Chevron: Lucide `ChevronRight`, rotates 90° when open (CSS, 150 ms — Rule 9 allows
  expand/collapse motion). `aria-expanded` and `aria-controls` on the button, label
  "Show employees" / "Hide employees".
- Tokens only; the shadcn `SidebarMenuAction` / `SidebarMenuSub*` primitives.

## Not changed

`navItems` stays as it is: Finance Oversight is not added to it (its URL lives under the
hub and the docs coverage test, `tests/docs.test.ts`, maps one doc per `navItems` entry).
The list comes from a new pure function instead.

## Code

- `lib/navigation.ts` — `hubChildren(hubHref)`: the employees entered through a hub, in
  roster order, including the ones that live under the hub's own URL.
- `components/layout/app-sidebar.tsx` — the hub row renders the chevron and the sub-list.

## Acceptance criteria

1. The Digital Employees row shows a chevron; clicking it toggles a list of the five
   employees, in roster order.
2. Clicking an employee navigates to it; the row stays lit and that employee is highlighted.
3. Clicking the row navigates to `/employees` and opens the list.
4. On `/spotlight`, `/employees/finance/bills/…` etc. the list is open on load.
5. An employee hidden by the workspace (any reason, `not_connected` included) does not appear.
6. Collapsed sidebar: no chevron, no list.
7. `tests/navigation.test.ts` covers `hubChildren`; `npm test`, `npx tsc --noEmit` and
   `npm run build` pass.

## Manual verification

- Expanded sidebar, light and dark: chevron rotates, list indents under the row with the
  border line, the chevron sits at the row's right edge (the NEW badge was removed, see Patches).
- Keyboard: Tab reaches the chevron, Enter/Space toggles it, the links follow.
- Collapse the sidebar (⌘B): only the icon row remains.

## Patches

- **2026-10-01 — NEW badge removed** (owner): the Digital Employees row no longer carries
  the `NEW` badge, so the chevron sits alone at the row's right edge.
- **2026-10-01 — Finance listed before QuickBooks is connected** (owner: "why in drop down
  finance is missing"). The list used `visibleItems`, which drops `not_connected`; the hub
  page shows Finance with a Set-up row, so the dropdown now uses `hubListedItems`, which
  keeps `not_connected` and still drops `permission` / `feature` / `calendar`.
- **2026-10-01 — reverted to progressive disclosure** (owner: "it's part of progressive
  disclosure — hide it, as we decided"). `hubListedItems` is removed; the list uses
  `visibleItems` again, so Finance appears only once QuickBooks is connected.
