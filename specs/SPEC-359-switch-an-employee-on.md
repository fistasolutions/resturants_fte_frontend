# SPEC-359 — Switch a digital employee on from its card (Phase 3, frontend)

**Status:** implemented 2026-10-08 · **Repo:** frontend · **Phase 3 of 6** · **Backend:**
SPEC-367 (`PUT /employees/{key}/active`) · **Builds on:** SPEC-357 (the guided view),
SPEC-290/291 (the employee cards), SPEC-358 (actions follow the role), root Rules 12 and 13

## Why

Owner (2026-10-08): digital employees are switched on from their card, never from the sidebar.

- Search Visibility and Report Builder start on.
- An employee that needs an integration creates a to-do to connect it, shown at the top right.

SPEC-357 already hides an inactive employee's page. This spec gives the owner the switch.

## What changes

### 1. A switch on each card (guided organizations only)

The switch is labelled **Active** and sits on the card's top row, beside the status badge, above
the card's stretched link so a click never opens the employee.

- **Its state** is `visibility.employees[key].active` from the workspace.
- **A click** sends `setEmployeeActive(key, active)` (`services/employees-actions.ts`) and
  shows the new state at once. It then refreshes the layout (`router.refresh()`), so the
  sidebar, the access gate and the to-dos follow with no reload.
- **On failure** the switch goes back and the card says why, in one line, under the switch row.
- **Roles (Rule 13):** the switch is a secondary control, so it is wrapped in `RoleGate` with
  `settings.manage` (the backend's policy). A member without it sees no switch, and still sees
  whether the employee is on or off.

### 2. What the card says

- **Off:** the character is dimmed and the card reads "Switched off. Switch it on to add it to
  your sidebar." (members without the switch read "Switched off."). The name is not a link and
  "Open" is hidden, because an inactive employee's page is locked anyway.
- **On but missing its integration** (`ready: false`): a row reads **Connect QuickBooks Online**
  and links to that integration's page (`integrationHref`). It takes the place of the set-up row.
- **On and ready:** the card is exactly as today.

### 3. The to-dos at the top right

The Digital Employees header gets a **To do** button on its right, showing the count, whenever
the workspace has to-dos. It opens a short list, one line per to-do, for example "Connect
QuickBooks Online for Accounts Payable", each linking to the integration's page.

The labels are pure (`lib/employee-switch.ts`): employee names from the sidebar, integration
names from `CONNECTIONS`. Phase 5 turns this into the app-wide setup checklist.

### 4. Registry (Rule 13)

`lib/action-permissions.ts` gains `"employees-actions:setEmployeeActive": ["settings.manage"]`.

## What FOC sees (Rule 12)

Unchanged. FOC is `full`: no switch is drawn, no card is dimmed and there are no to-dos, so its
cards and header are exactly as before.

## Acceptance criteria

1. **On a guided organization, an owner switches Accounts Payable on:**
   - the card shows Active and a **Connect QuickBooks Online** row;
   - the header shows **To do · 1**;
   - after the refresh, Accounts Payable is in the sidebar under Digital Employees.
2. Switching Search Visibility off dims its card, removes it from the sidebar, and its page then
   says it isn't active.
3. A manager sees no switch; a failed request reverts the switch and says why.
4. A full organization sees no switch, no dimming and no to-dos.
5. Vitest covers `lib/employee-switch.ts`, the role-gate coverage test passes, and `npm test`,
   `npx tsc --noEmit` and `npm run build` pass on a clean copy.

## Patches

- **2026-10-08 · SPEC-360 replaces the To do button.** Setup is now app-wide: it sits at the top
  right of every page, with a progress bar, and covers pages and tabs as well as employees. The
  Digital Employees header no longer has its own To do. Backend SPEC-368 replaced the response's
  `todos` with `visibility.setup`. The employee switch's response is now `{"employees": [...]}`.
- **2026-10-08 · An employee switched on without its integration is in the sidebar.** Accounts
  Payable is gated on QuickBooks by `navigation.py`. Until SPEC-368 it stayed out of the sidebar
  until connected, against criterion 1. It is now shown, waiting for its connection
  (`awaiting_connection`), and opens on the connect screen.
