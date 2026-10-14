# SPEC-316 — Team & Roles: invite people, give them a role, build your own roles

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-28
**Programme:** `SPEC-311-saas-platform-master.md`, slice **F6**
**Backend contract:** backend SPEC-313 (invitations) and SPEC-317 (RBAC), all under
`/organizations/current/`:
`GET/POST /invitations`, `DELETE /invitations/{id}` · `GET /members`, `PATCH /members/{id}`
(`role_key`, `status`), `DELETE /members/{id}` · `POST /owner` (`user_id`) · `GET/POST /roles`,
`PATCH /roles/{key}`, `POST /roles/{key}/reset`, `DELETE /roles/{key}` · `GET /permissions`
(grouped catalogue) · `GET /audit` (`limit`, `before`, `next_before`). The signed-in member's own
permissions come from `GET /auth/me` → `organizations[]` (the active one).

## Why

The owner (D8): an organization is a team — the owner invites people, gives each a role, and
can build a role of their own from the permission list. The backend enforces all of it
(SPEC-317); there is no screen for it.

## Behaviour

Two new Settings tabs, after Watching: **Team** and **Roles**.

**Team** (`/settings/team`)
- **Members table:** name + email, role, status (Active / Disabled), joined. The owner's row
  says *Owner*; your own row says *You*.
- **Row actions** (a ⋯ menu), shown only when they would be allowed — never a button that
  can only fail:
  - *Change role* — to any role you could grant yourself (a role whose permissions are all
    yours; the Owner role is never offered).
  - *Disable* / *Enable*, *Remove from organization* (confirmed).
  - *Make owner* — only the owner sees it, only on an active member (confirmed: "You become an
    Admin").
  - None on the owner's row or on your own row.
- **Pending invitations:** email, role, expires; *Revoke* (confirmed).
- **Invite** (a dialog): email + role (the same grantable roles). On success: "Invitation sent",
  or when `emailed` is false, "Invitation created — the email could not be sent; ask them to sign
  up with this address" (the invitation still stands).
- **Activity** (the audit log, only for `audit.view`): newest first, one plain sentence per
  event ("Sara changed Omar's role from Viewer to Analyst"), with **Show more** paging on
  `next_before`.
- A member without `team.view` sees "Your role doesn't include the team" in place of the tab.
  Without `team.manage` the table is read-only and Invite is hidden.

**Roles** (`/settings/roles`)
- **Role list** (left on desktop, top on mobile): name, *Built-in* badge, member count.
- **Role editor** (right): name, description, and the **permission grid** — one card per group,
  a checkbox per permission with its description, and a group checkbox (all / some / none).
  - The Owner role is shown as "Everything, always" and cannot be edited.
  - A permission you do not hold yourself is shown disabled with "You don't have this" —
    the backend refuses escalation (`escalation_refused`), the screen never invites it.
  - **Save** is enabled only when something changed; **Reset to default** on a built-in role
    (confirmed); **Delete** on a custom role with no members (a role in use says "Move its N
    members to another role first" instead of a button that fails).
- **New role**: name + description, starting from no permissions (or a copy of the selected
  role — "Duplicate").
- Without `roles.manage` the grid is read-only.

Errors from the backend arrive as `{error: {code, message}}` and are shown in place with the
backend's own words (`owner_protected`, `cannot_change_self`, `role_in_use`, …).

## How

- `lib/queries/team.ts` — `teamPaths` + `teamQueries`: `members`, `invitations`, `roles`,
  `permissions`, `audit(before)`, `access` (`/auth/me`, adapted to the active organization's
  user id, role and permissions). Keys under `["team", …]`; pinned in
  `tests/query-registries.test.ts`.
- `lib/team.ts` (pure): API → view adapters; `can`; `grantableRoles`; `memberActions`;
  `canGrant` for a grid checkbox; `togglePermission`, `groupState`, `toggleGroup`; `roleDirty`;
  `auditSentence`; `inviteOutcome`.
- `services/team.ts` — the writes through `/api/proxy`, throwing the shared `ApiError`.
- `features/settings/team-view.tsx`, `member-dialogs.tsx` (invite, change role), `team-activity.tsx`,
  `roles-view.tsx`, `role-editor.tsx`; pages `app/(app)/settings/team/page.tsx` and
  `roles/page.tsx` prefetch their reads in parallel (no awaits, SPEC-230).
- Every write invalidates `["team"]`. Round trips: Team = 4 reads in parallel (+ audit), Roles =
  3 in parallel.
- In-app docs: the Settings doc gets Team and Roles sections (root Rule 11).

## Tests

Vitest (`tests/team.test.ts`): adapters; `can` (owner `*`, listed, missing); grantable roles
(subset rule, owner role excluded); member actions (self, owner row, disabled row, owner-only
Make owner, no `team.manage`); `canGrant`; toggle/group state/toggle group; dirty check; audit
sentences for each action and an unknown one; invite outcome. Registry test extended.
`npm test`, `npx tsc --noEmit`, `npm run build` green.

Manual: invite → accept in another browser → the member appears; change role, disable, enable,
remove; revoke an invite; a Viewer sees the permission message; create, edit, reset, delete a
role; a role in use cannot be deleted; light and dark; phone width.

## Acceptance criteria

- [x] Team: members, invitations, invite, change role, disable/enable, remove, make owner, activity.
- [x] Roles: list, permission grid, create, duplicate, edit, reset, delete.
- [x] Only actions the member may take are offered; the backend's refusal is shown in its words.
- [x] Reads prefetched in parallel; writes refresh the team cache.
- [x] Settings doc updated; tests, type-check and build green.

## Verification (2026-09-28)

`npm test` 2,081 passed (184 files, 17 new in `tests/team.test.ts`, the registry test extended);
`npx tsc --noEmit` clean; eslint clean on every touched file; `npm run build` green. All five
criteria done in code; the manual invite → accept pass runs against the new deployment.
