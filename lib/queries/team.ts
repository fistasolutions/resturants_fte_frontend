/** Team & Roles (SPEC-316): the organization's members, invitations, roles, permission
 * catalogue and audit log, plus the signed-in member's own access — each defined once for
 * both transports. */
import { defineQuery } from "@/lib/query-def";
import {
  toAccess,
  toAuditPage,
  toInvitation,
  toMember,
  toPermissionGroup,
  toRole,
  toSeats,
  type ApiAuditPage,
  type ApiInvitation,
  type ApiMe,
  type ApiMember,
  type ApiPermissionGroup,
  type ApiRole,
  type ApiSeats,
  type AuditPage,
  type Invitation,
  type Member,
  type PermissionGroup,
  type Role,
  type Seats,
  type TeamAccess,
} from "@/lib/team";

const BASE = "/organizations/current";
export const AUDIT_PAGE_SIZE = 25;

export const teamPaths = {
  members: (): string => `${BASE}/members`,
  seats: (): string => `${BASE}/seats`,
  invitations: (): string => `${BASE}/invitations`,
  roles: (): string => `${BASE}/roles`,
  permissions: (): string => `${BASE}/permissions`,
  audit: (before: number | null): string =>
    `${BASE}/audit?limit=${AUDIT_PAGE_SIZE}${before ? `&before=${before}` : ""}`,
  access: (): string => "/auth/me",
} as const;

export const teamQueries = {
  members: () =>
    defineQuery<Member[]>(["team", "members"], async (api) =>
      (await api<{ members: ApiMember[] }>(teamPaths.members())).members.map(toMember),
    ),
  seats: () =>
    defineQuery<Seats>(["team", "seats"], async (api) =>
      toSeats(await api<ApiSeats>(teamPaths.seats())),
    ),
  invitations: () =>
    defineQuery<Invitation[]>(["team", "invitations"], async (api) =>
      (await api<{ invitations: ApiInvitation[] }>(teamPaths.invitations())).invitations.map(
        toInvitation,
      ),
    ),
  roles: () =>
    defineQuery<Role[]>(["team", "roles"], async (api) =>
      (await api<{ roles: ApiRole[] }>(teamPaths.roles())).roles.map(toRole),
    ),
  permissions: () =>
    defineQuery<PermissionGroup[]>(["team", "permissions"], async (api) =>
      (await api<{ groups: ApiPermissionGroup[] }>(teamPaths.permissions())).groups.map(
        toPermissionGroup,
      ),
    ),
  audit: (before: number | null = null) =>
    defineQuery<AuditPage>(["team", "audit", before], async (api) =>
      toAuditPage(await api<ApiAuditPage>(teamPaths.audit(before))),
    ),
  access: () =>
    defineQuery<TeamAccess>(["team", "access"], async (api) =>
      toAccess(await api<ApiMe>(teamPaths.access())),
    ),
} as const;
