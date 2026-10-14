# SPEC-358 — Every action follows the member's role (and the build checks it)

**Status:** implemented 2026-10-08 · **Repo:** frontend (no backend change) · **Builds on:**
backend SPEC-317 (access control — the route policy every write is enforced by), frontend
SPEC-316 (team and roles), SPEC-315 (pages hidden by role) · **Root rule:** ABSOLUTE RULE 13

## Why

Owner (2026-10-08): "hide or grey out the buttons a role can't use; make it a rule and check it
automatically."

The server already refuses every write a role may not make: backend SPEC-317's route policy
covers more than 400 store routes, and its build guard fails on an unclassified one. The sidebar
already hides pages, and Settings already hides its own controls. But inside the pages, about 250
write actions across about 45 screens (publish, approve, send, export, save, delete) did not
know the role. A Manager or a Viewer clicked them and got a 403.

## What FOC sees after this change

**The owner: unchanged.** The owner holds every permission (`*`), so every button is exactly as
today. A FOC team member with a narrower role now sees a disabled button with the reason, or no
button, where they used to get an error. The server's rules are not touched.

## The rule (root ABSOLUTE RULE 13)

1. **Every write action on a screen is gated by the member's role.** It goes through one helper
   (`hooks/use-can.ts`) or one of two components (`components/shared/role-gate.tsx`):
   - **`RoleButton`** — main actions (send, publish, approve, export, generate, sync, delete).
     It is shown disabled with the reason, so the member knows the work needs someone else:
     "Your role (Manager) doesn't include "Publish social posts". Ask the store owner or an
     admin."
   - **`RoleGate`** — small and secondary actions (edit, menu items, toggles, settings rows). They
     are hidden.
   - **`useCan()`** — when a control already has its own disabled logic (it adds the role to it).
2. **One source for which permission an action needs:** `lib/action-permissions.ts`. Every
   write function in `services/*.ts`, and every screen that writes directly, has exactly the
   permission(s) the backend route policy (SPEC-317) enforces. A few are marked `member`: chat,
   your own account, notifications, sign-in and onboarding, things every member or no
   membership does.
3. **The permission names** are `lib/permissions.ts`: the backend catalogue's 57 keys and their
   labels, pinned.
4. **A role is not a connection.** A missing permission is the role's reason. A read-only Klaviyo
   key (SPEC-353/356) or a missing integration is the connection's reason. Each is said in its
   own words, and the role's reason wins when both apply.
5. **The server stays the guard.** The screen only reflects it; nothing is allowed because a
   button showed.
6. **Unknown → as today.** While the member's access is loading, or when an older backend sends
   none, nothing is greyed out. A brief flash of a disabled button is worse than a 403 the server
   would give anyway.

## The automatic check (`tests/role-gate-coverage.test.ts`)

It fails the build when:

- a write function in `services/*.ts` (one that sends POST/PUT/PATCH/DELETE, directly or through
  a module helper) has no entry in `ACTION_PERMISSIONS`, or an entry names a function that no
  longer exists;
- a screen that writes directly (a write verb in a `.tsx`) has no entry in `SCREEN_WRITES`;
- any permission named in either is not in `lib/permissions.ts`;
- a `.tsx` under `features/`, `components/` or `app/` imports a write function, or writes
  directly, whose permissions are not `member`, but either does not import the role helper or
  component, or does not name every one of those permissions;
- a `.ts` hook under `features/` or `hooks/` that imports such a write passes it to screens: then
  every screen importing that hook is held to the hook's permissions.

## Acceptance criteria

1. `roleGate` / `useCan`: owner allows all; a member allows exactly their keys; the reason names
   the role and the permission's label; unknown access allows.
2. `RoleButton` is disabled with the reason (tooltip and screen-reader text); `RoleGate` renders
   nothing without the permission.
3. Every screen with a non-member write passes the coverage check; the check fails on a planted
   ungated write, a planted unregistered write function, and a misspelt permission.
4. `npm test`, `npx tsc --noEmit`, lint on touched files, `npm run build` green.
5. In-app docs: the Settings doc's Team & Roles section says how buttons follow the role (the overview is another session's file today).

## Verification (2026-10-08)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `roleGate` / `useCan` | done | `lib/role-gate.ts`, `hooks/use-can.ts`; `tests/role-gate.test.ts` (owner, exact keys, the reason names the role and the label, all-of lists name only what is missing, member and owner kinds, unknown access allows, nameless role) |
| 2 | `RoleButton` / `RoleGate` | done | `components/shared/role-gate.tsx`. A denied `RoleButton` is `aria-disabled` (not `disabled`): it keeps its place in the layout and its focus, the tooltip and screen-reader text carry the reason, and a press, a submit included, does nothing. `RoleGate` renders nothing |
| 3 | Every screen passes; planted failures fail | done | `tests/role-gate-coverage.test.ts`: 269 registry entries (249 service write functions + 20 directly-writing screens), each permission taken from the backend route policy by exporting `policy.required()` for every write route and matching it (199 exact, the rest checked by hand). It went from 237 problems in 108 screens to none. Planting an ungated `ipacky-upload.tsx` fails it with the file and the permission; the scan's own tests fail an ungated import, a wrong permission and a hook screen gating none of its hook's writes |
| 4 | test / tsc / lint / build | done | `npm test` **2,520 passed** (225 files); `npx tsc --noEmit` clean; `npm run lint` 0 errors (3 old warnings); `npm run build` compiled |
| 5 | In-app docs | done | `lib/docs/content/settings.ts` Roles section; `updated` bumped |

Notes:
- Pass-through components the scan cannot see, because they write through a callback, were gated
  by hand: the knowledge card's Re-check, the style prompt and bench, the research toast's retry,
  the picture strip and carousel delete, the report Generate button, the returns-backlog compose
  page's `sendNeed`, and the support approval card (each button with its own permission).
- A screen using a `use-*-actions` hook must gate at least one of the hook's permissions; direct
  imports must gate all of theirs.
- The compose panels take `sendNeed`: `messages.send` plus the caller's area permission.
- FOC's owner holds `*`: no visible change.
