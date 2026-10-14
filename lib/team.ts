/**
 * Team & Roles (SPEC-316) — the pure half: API → view adapters, what the signed-in member may
 * do, the permission grid's arithmetic, and the audit log's sentences. The backend enforces
 * every rule (backend SPEC-317); these decide only what the screen offers, so a button is
 * never shown that can only fail.
 */

// ── API shapes (backend `routes/organizations.py`, `routes/auth.py`) ───────────

export interface ApiMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role_key: string;
  role_name: string;
  status: string;
  location_ids: number[] | null;
  joined_at: string;
}

export interface ApiInvitation {
  id: number;
  email: string;
  role_key: string;
  role_name: string;
  expires_at: string;
  created_at: string;
}

export interface ApiRole {
  key: string;
  name: string;
  description: string;
  is_system: boolean;
  is_owner: boolean;
  permissions: string[];
  members: number;
}

export interface ApiPermissionGroup {
  key: string;
  title: string;
  permissions: { key: string; label: string; description: string }[];
}

export interface ApiAuditEvent {
  id: number;
  action: string;
  target_type: string;
  target_id: string | null;
  detail: Record<string, unknown>;
  actor_user_id: number | null;
  actor_name: string | null;
  created_at: string;
}

export interface ApiAuditPage {
  events: ApiAuditEvent[];
  next_before: number | null;
}

export interface ApiMe {
  id: number;
  name: string;
  active_organization_id: number | null;
  organizations: {
    id: number;
    name: string;
    role: { key: string; name: string };
    permissions: string[];
  }[];
}

// ── View models ─────────────────────────────────────────────────────────────

export interface Member {
  id: number;
  userId: number;
  name: string;
  email: string;
  roleKey: string;
  roleName: string;
  active: boolean;
  joinedAt: string;
}

export interface Invitation {
  id: number;
  email: string;
  roleKey: string;
  roleName: string;
  expiresAt: string;
}

export interface Role {
  key: string;
  name: string;
  description: string;
  builtIn: boolean;
  isOwner: boolean;
  permissions: string[];
  members: number;
}

export interface Permission {
  key: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  key: string;
  title: string;
  permissions: Permission[];
}

export interface AuditEvent {
  id: number;
  action: string;
  targetId: string | null;
  detail: Record<string, unknown>;
  actorName: string | null;
  createdAt: string;
}

export interface AuditPage {
  events: AuditEvent[];
  nextBefore: number | null;
}

/** The signed-in member in the active organization. */
export interface TeamAccess {
  userId: number;
  roleKey: string | null;
  /** The role's display name ("Manager"); null when the member has no organization. */
  roleName: string | null;
  permissions: string[];
}

export const OWNER_PERMISSION = "*";

export function toMember(api: ApiMember): Member {
  return {
    id: api.id,
    userId: api.user_id,
    name: api.name,
    email: api.email,
    roleKey: api.role_key,
    roleName: api.role_name,
    active: api.status === "active",
    joinedAt: api.joined_at,
  };
}

// ── Seats (SPEC-373, backend SPEC-382) ───────────────────────────────────────

export interface ApiSeats {
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

export interface Seats {
  used: number;
  /** null = unlimited. */
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

export function toSeats(api: ApiSeats): Seats {
  return {
    used: api.used,
    limit: api.limit,
    remaining: api.remaining,
    unlimited: api.unlimited,
  };
}

/** The header line: "7 of 10 members · 3 seats left", or "7 members · 2 invited" when unlimited.
 * `pending` is the count of invitations that have not been accepted yet. */
export function seatLine(seats: Seats | undefined, members: number, pending: number): string {
  const people = `${members} ${members === 1 ? "member" : "members"}`;
  if (!seats || seats.unlimited || seats.limit === null) {
    return pending > 0 ? `${people} · ${pending} invited` : people;
  }
  const left = seats.remaining ?? 0;
  const leftLabel = left === 1 ? "1 seat left" : `${left} seats left`;
  return `${seats.used} of ${seats.limit} members · ${leftLabel}`;
}

/** True only when the plan has a seat limit and none is left. */
export function seatsFull(seats: Seats | undefined): boolean {
  return Boolean(seats && !seats.unlimited && seats.limit !== null && (seats.remaining ?? 0) <= 0);
}

/** Why the invite button is disabled when the plan is full. */
export function seatsFullReason(seats: Seats | undefined): string {
  const limit = seats?.limit ?? 0;
  return `Your plan's ${limit} ${limit === 1 ? "seat is" : "seats are"} all in use. Upgrade your plan or remove a member to invite more.`;
}

export function toInvitation(api: ApiInvitation): Invitation {
  return {
    id: api.id,
    email: api.email,
    roleKey: api.role_key,
    roleName: api.role_name,
    expiresAt: api.expires_at,
  };
}

export function toRole(api: ApiRole): Role {
  return {
    key: api.key,
    name: api.name,
    description: api.description,
    builtIn: api.is_system,
    isOwner: api.is_owner,
    permissions: api.permissions,
    members: api.members,
  };
}

export function toPermissionGroup(api: ApiPermissionGroup): PermissionGroup {
  return { key: api.key, title: api.title, permissions: api.permissions.map((p) => ({ ...p })) };
}

export function toAuditPage(api: ApiAuditPage): AuditPage {
  return {
    events: (api.events ?? []).map((e) => ({
      id: e.id,
      action: e.action,
      targetId: e.target_id,
      detail: e.detail ?? {},
      actorName: e.actor_name,
      createdAt: e.created_at,
    })),
    nextBefore: api.next_before ?? null,
  };
}

/** The active organization's membership; the first one when the token names none. */
export function toAccess(api: ApiMe): TeamAccess {
  const organizations = api.organizations ?? [];
  const active =
    organizations.find((o) => o.id === api.active_organization_id) ?? organizations[0] ?? null;
  return {
    userId: api.id,
    roleKey: active?.role.key ?? null,
    roleName: active?.role.name ?? null,
    permissions: active?.permissions ?? [],
  };
}

// ── What the member may do ──────────────────────────────────────────────────

export function isOwnerAccess(access: TeamAccess): boolean {
  return access.permissions.includes(OWNER_PERMISSION);
}

export function can(access: TeamAccess, permission: string): boolean {
  return isOwnerAccess(access) || access.permissions.includes(permission);
}

/** Whether a permission checkbox may be ticked: you can only grant what you hold. */
export function canGrant(access: TeamAccess, permission: string): boolean {
  return can(access, permission);
}

/** Roles you may give someone: never the Owner role, and only roles wholly within yours. */
export function grantableRoles(roles: Role[], access: TeamAccess): Role[] {
  return roles.filter((r) => !r.isOwner && r.permissions.every((p) => canGrant(access, p)));
}

export interface MemberActions {
  changeRole: boolean;
  toggleActive: boolean;
  remove: boolean;
  makeOwner: boolean;
}

const NO_ACTIONS: MemberActions = {
  changeRole: false,
  toggleActive: false,
  remove: false,
  makeOwner: false,
};

/** The ⋯ menu for a row. The owner's row and your own row carry none (the backend refuses
 * both — `owner_protected`, `cannot_change_self`). */
export function memberActions(
  member: Member,
  access: TeamAccess,
  ownerRoleKeys: ReadonlySet<string>,
): MemberActions {
  if (member.userId === access.userId || ownerRoleKeys.has(member.roleKey)) return NO_ACTIONS;
  const manage = can(access, "team.manage");
  return {
    changeRole: manage,
    toggleActive: manage,
    remove: manage,
    makeOwner: isOwnerAccess(access) && member.active,
  };
}

export function hasAnyAction(actions: MemberActions): boolean {
  return actions.changeRole || actions.toggleActive || actions.remove || actions.makeOwner;
}

// ── The permission grid ─────────────────────────────────────────────────────

export function togglePermission(selected: readonly string[], key: string): string[] {
  return selected.includes(key)
    ? selected.filter((k) => k !== key)
    : [...selected, key].sort();
}

export type GroupState = "all" | "some" | "none";

export function groupState(group: PermissionGroup, selected: readonly string[]): GroupState {
  const on = group.permissions.filter((p) => selected.includes(p.key)).length;
  if (on === 0) return "none";
  return on === group.permissions.length ? "all" : "some";
}

/** The group checkbox: fills every permission you may grant, or clears them all. A
 * permission you cannot grant is left exactly as it was. */
export function toggleGroup(
  group: PermissionGroup,
  selected: readonly string[],
  access: TeamAccess,
): string[] {
  const grantable = group.permissions.map((p) => p.key).filter((k) => canGrant(access, k));
  const fill = grantable.some((k) => !selected.includes(k));
  const next = new Set(selected);
  for (const key of grantable) {
    if (fill) next.add(key);
    else next.delete(key);
  }
  return [...next].sort();
}

export interface RoleDraft {
  name: string;
  description: string;
  permissions: string[];
}

export function draftOf(role: Role): RoleDraft {
  return { name: role.name, description: role.description, permissions: [...role.permissions].sort() };
}

export function roleDirty(role: Role, draft: RoleDraft): boolean {
  const base = draftOf(role);
  return (
    base.name !== draft.name.trim() ||
    base.description !== draft.description.trim() ||
    base.permissions.join(",") !== [...draft.permissions].sort().join(",")
  );
}

/** Why a role cannot be deleted, or null when it can. */
export function deleteBlocker(role: Role): string | null {
  if (role.isOwner || role.builtIn) return "Built-in roles can be edited or reset, not deleted.";
  if (role.members > 0) {
    return `Move its ${role.members} member${role.members === 1 ? "" : "s"} to another role first.`;
  }
  return null;
}

// ── Invitations ─────────────────────────────────────────────────────────────

export function inviteOutcome(email: string, emailed: boolean): string {
  return emailed
    ? `Invitation sent to ${email}.`
    : `Invitation created — the email could not be sent. Ask ${email} to sign up with this address.`;
}

/** "in 5 days", "in 3 hours", "expired" — for an invitation's expiry. */
export function expiresIn(iso: string, now: Date = new Date()): string {
  const ms = new Date(iso).getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "expired";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "in under an hour";
  if (hours < 48) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  return `in ${Math.floor(hours / 24)} days`;
}

// ── The audit log ───────────────────────────────────────────────────────────

export interface AuditNames {
  member: (userId: number) => string | null;
  role: (key: string) => string | null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function change(value: unknown): { from: unknown; to: unknown } | null {
  if (value && typeof value === "object" && "from" in value && "to" in value) {
    return value as { from: unknown; to: unknown };
  }
  return null;
}

/** One plain sentence per event. An action this screen does not know is still shown, in words. */
export function auditSentence(event: AuditEvent, names: AuditNames): string {
  const actor = event.actorName ?? "Someone";
  const d = event.detail;
  const roleName = (key: unknown) => (typeof key === "string" ? names.role(key) ?? key : "a role");
  const person = (id: unknown, fallback: unknown = null) =>
    (typeof id === "number" ? names.member(id) : null) ?? text(fallback) ?? "a member";

  switch (event.action) {
    case "invitation.created":
      return `${actor} invited ${text(d.email) ?? "someone"} as ${roleName(d.role)}`;
    case "invitation.revoked":
      return `${actor} revoked an invitation`;
    case "invitation.accepted":
      return `${actor} joined as ${roleName(d.role)}`;
    case "member.removed":
      return `${actor} removed ${person(d.user_id, d.email)}`;
    case "member.updated": {
      const who = person(d.user_id);
      const parts: string[] = [];
      const role = change(d.role);
      if (role) parts.push(`changed ${who}'s role from ${roleName(role.from)} to ${roleName(role.to)}`);
      const status = change(d.status);
      if (status) parts.push(`${status.to === "disabled" ? "disabled" : "enabled"} ${who}`);
      if (change(d.locations)) parts.push(`changed ${who}'s locations`);
      return parts.length ? `${actor} ${parts.join(" and ")}` : `${actor} updated ${who}`;
    }
    case "ownership.transferred":
      return `${actor} made ${person(d.to_user_id)} the owner`;
    case "role.created":
      return `${actor} created the role ${text(d.name) ?? "a role"}`;
    case "role.updated": {
      const name = change(d.name);
      const target = name ? text(name.to) : event.targetId ? roleName(event.targetId) : null;
      return `${actor} edited the role ${target ?? "a role"}`;
    }
    case "role.reset":
      return `${actor} reset ${event.targetId ? roleName(event.targetId) : "a role"} to its default`;
    case "role.deleted":
      return `${actor} deleted the role ${text(d.name) ?? event.targetId ?? "a role"}`;
    default:
      return `${actor} — ${event.action.replace(/[._]/g, " ")}`;
  }
}
