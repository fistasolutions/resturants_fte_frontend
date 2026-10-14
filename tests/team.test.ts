import { describe, expect, it } from "vitest";

import {
  auditSentence,
  can,
  canGrant,
  deleteBlocker,
  draftOf,
  expiresIn,
  grantableRoles,
  groupState,
  hasAnyAction,
  inviteOutcome,
  memberActions,
  seatLine,
  seatsFull,
  seatsFullReason,
  toSeats,
  roleDirty,
  toAccess,
  toAuditPage,
  toMember,
  toRole,
  toggleGroup,
  togglePermission,
  type AuditEvent,
  type Member,
  type PermissionGroup,
  type Role,
  type TeamAccess,
} from "@/lib/team";

const owner: TeamAccess = { userId: 1, roleKey: "owner", roleName: "Owner", permissions: ["*"] };
const admin: TeamAccess = {
  userId: 2,
  roleKey: "admin",
  roleName: "Admin",
  permissions: ["orders.view", "team.manage", "team.view"],
};
const viewer: TeamAccess = { userId: 3, roleKey: "viewer", roleName: "Viewer", permissions: ["orders.view", "team.view"] };

function role(key: string, permissions: string[], extra: Partial<Role> = {}): Role {
  return { key, name: key, description: "", builtIn: true, isOwner: false, permissions, members: 0, ...extra };
}

function member(userId: number, roleKey: string, active = true): Member {
  return {
    id: userId * 10,
    userId,
    name: `User ${userId}`,
    email: `u${userId}@examplestore.com`,
    roleKey,
    roleName: roleKey,
    active,
    joinedAt: "2026-09-01T00:00:00Z",
  };
}

const OWNER_KEYS = new Set(["owner"]);
const group: PermissionGroup = {
  key: "team",
  title: "Team",
  permissions: [
    { key: "team.view", label: "See", description: "" },
    { key: "team.manage", label: "Manage", description: "" },
    { key: "roles.manage", label: "Roles", description: "" },
  ],
};

describe("adapters", () => {
  it("maps a member, a role and an audit page", () => {
    const m = toMember({
      id: 5, user_id: 9, name: "Sara", email: "s@examplestore.com", role_key: "analyst",
      role_name: "Analyst", status: "disabled", location_ids: null, joined_at: "2026-09-01",
    });
    expect(m).toMatchObject({ id: 5, userId: 9, active: false, roleName: "Analyst" });
    expect(toRole({ key: "owner", name: "Owner", description: "", is_system: true, is_owner: true, permissions: ["*"], members: 1 }))
      .toMatchObject({ builtIn: true, isOwner: true });
    const page = toAuditPage({
      events: [{ id: 3, action: "role.reset", target_type: "role", target_id: "viewer", detail: {}, actor_user_id: 1, actor_name: "Ann", created_at: "x" }],
      next_before: 3,
    });
    expect(page.nextBefore).toBe(3);
    expect(page.events[0]).toMatchObject({ targetId: "viewer", actorName: "Ann" });
  });

  it("reads the active organization's access, falling back to the first", () => {
    const me = {
      id: 7, name: "A", active_organization_id: 2,
      organizations: [
        { id: 1, name: "One", role: { key: "viewer", name: "Viewer" }, permissions: ["a"] },
        { id: 2, name: "Two", role: { key: "admin", name: "Admin" }, permissions: ["b"] },
      ],
    };
    expect(toAccess(me)).toEqual({ userId: 7, roleKey: "admin", roleName: "Admin", permissions: ["b"] });
    expect(toAccess({ ...me, active_organization_id: null }).roleKey).toBe("viewer");
    expect(toAccess({ ...me, organizations: [] })).toEqual({ userId: 7, roleKey: null, roleName: null, permissions: [] });
  });
});

describe("what the member may do", () => {
  it("can: owner holds everything, others only what is listed", () => {
    expect(can(owner, "anything")).toBe(true);
    expect(can(admin, "team.manage")).toBe(true);
    expect(can(viewer, "team.manage")).toBe(false);
    expect(canGrant(viewer, "orders.view")).toBe(true);
  });

  it("grantable roles exclude the owner role and any role beyond yours", () => {
    const roles = [
      role("owner", ["*"], { isOwner: true }),
      role("viewer", ["orders.view"]),
      role("finance", ["finance.view"]),
    ];
    expect(grantableRoles(roles, admin).map((r) => r.key)).toEqual(["viewer"]);
    expect(grantableRoles(roles, owner).map((r) => r.key)).toEqual(["viewer", "finance"]);
  });

  it("no actions on your own row or the owner's row", () => {
    expect(hasAnyAction(memberActions(member(2, "admin"), admin, OWNER_KEYS))).toBe(false);
    expect(hasAnyAction(memberActions(member(1, "owner"), admin, OWNER_KEYS))).toBe(false);
  });

  it("team.manage unlocks row actions; only the owner may hand over ownership", () => {
    expect(memberActions(member(4, "viewer"), admin, OWNER_KEYS)).toEqual({
      changeRole: true, toggleActive: true, remove: true, makeOwner: false,
    });
    expect(memberActions(member(4, "viewer"), owner, OWNER_KEYS).makeOwner).toBe(true);
    expect(memberActions(member(4, "viewer", false), owner, OWNER_KEYS).makeOwner).toBe(false);
    expect(hasAnyAction(memberActions(member(4, "viewer"), viewer, OWNER_KEYS))).toBe(false);
  });
});

describe("the permission grid", () => {
  it("toggles a permission, sorted", () => {
    expect(togglePermission(["b"], "a")).toEqual(["a", "b"]);
    expect(togglePermission(["a", "b"], "a")).toEqual(["b"]);
  });

  it("reports the group state", () => {
    expect(groupState(group, [])).toBe("none");
    expect(groupState(group, ["team.view"])).toBe("some");
    expect(groupState(group, ["team.view", "team.manage", "roles.manage"])).toBe("all");
  });

  it("the group checkbox fills only what you may grant, and clears it again", () => {
    const filled = toggleGroup(group, [], admin);
    expect(filled).toEqual(["team.manage", "team.view"]);
    expect(toggleGroup(group, filled, admin)).toEqual([]);
    // A permission you cannot grant is left as it was.
    expect(toggleGroup(group, ["roles.manage", "team.manage", "team.view"], admin)).toEqual(["roles.manage"]);
    expect(toggleGroup(group, [], owner)).toHaveLength(3);
  });

  it("is dirty only when something changed", () => {
    const r = role("custom", ["b", "a"], { builtIn: false, name: "Buyers" });
    const draft = draftOf(r);
    expect(roleDirty(r, draft)).toBe(false);
    expect(roleDirty(r, { ...draft, name: " Buyers " })).toBe(false);
    expect(roleDirty(r, { ...draft, permissions: ["a"] })).toBe(true);
    expect(roleDirty(r, { ...draft, description: "x" })).toBe(true);
  });

  it("says why a role cannot be deleted", () => {
    expect(deleteBlocker(role("viewer", []))).toMatch(/Built-in/);
    expect(deleteBlocker(role("c", [], { builtIn: false, members: 2 }))).toBe("Move its 2 members to another role first.");
    expect(deleteBlocker(role("c", [], { builtIn: false, members: 1 }))).toBe("Move its 1 member to another role first.");
    expect(deleteBlocker(role("c", [], { builtIn: false }))).toBeNull();
  });
});

describe("invitations", () => {
  it("words the outcome honestly when the email could not be sent", () => {
    expect(inviteOutcome("a@examplestore.com", true)).toBe("Invitation sent to a@examplestore.com.");
    expect(inviteOutcome("a@examplestore.com", false)).toMatch(/could not be sent/);
  });

  it("expiry in words", () => {
    const now = new Date("2026-09-28T00:00:00Z");
    expect(expiresIn("2026-09-27T00:00:00Z", now)).toBe("expired");
    expect(expiresIn("2026-09-28T00:30:00Z", now)).toBe("in under an hour");
    expect(expiresIn("2026-09-28T05:00:00Z", now)).toBe("in 5 hours");
    expect(expiresIn("2026-10-05T00:00:00Z", now)).toBe("in 7 days");
    expect(expiresIn("not a date", now)).toBe("expired");
  });
});

describe("the audit log", () => {
  const names = {
    member: (id: number) => ({ 4: "Omar" } as Record<number, string>)[id] ?? null,
    role: (key: string) => ({ viewer: "Viewer", analyst: "Analyst" } as Record<string, string>)[key] ?? null,
  };
  const event = (action: string, detail: Record<string, unknown> = {}, targetId: string | null = null): AuditEvent => ({
    id: 1, action, targetId, detail, actorName: "Sara", createdAt: "x",
  });

  it("writes one sentence per team action", () => {
    expect(auditSentence(event("invitation.created", { email: "n@examplestore.com", role: "viewer" }), names))
      .toBe("Sara invited n@examplestore.com as Viewer");
    expect(auditSentence(event("invitation.revoked"), names)).toBe("Sara revoked an invitation");
    expect(auditSentence(event("invitation.accepted", { role: "analyst" }), names)).toBe("Sara joined as Analyst");
    expect(auditSentence(event("member.removed", { user_id: 99, email: "gone@examplestore.com" }), names))
      .toBe("Sara removed gone@examplestore.com");
    expect(auditSentence(event("member.updated", { user_id: 4, role: { from: "viewer", to: "analyst" } }), names))
      .toBe("Sara changed Omar's role from Viewer to Analyst");
    expect(auditSentence(event("member.updated", { user_id: 4, status: { from: "active", to: "disabled" } }), names))
      .toBe("Sara disabled Omar");
    expect(auditSentence(event("ownership.transferred", { to_user_id: 4 }), names)).toBe("Sara made Omar the owner");
    expect(auditSentence(event("role.created", { name: "Buyers" }), names)).toBe("Sara created the role Buyers");
    expect(auditSentence(event("role.updated", { name: { from: "A", to: "B" } }), names)).toBe("Sara edited the role B");
    expect(auditSentence(event("role.updated", {}, "viewer"), names)).toBe("Sara edited the role Viewer");
    expect(auditSentence(event("role.reset", {}, "viewer"), names)).toBe("Sara reset Viewer to its default");
    expect(auditSentence(event("role.deleted", { name: "Buyers" }), names)).toBe("Sara deleted the role Buyers");
  });

  it("an unknown action is still said in words, and a missing actor is Someone", () => {
    expect(auditSentence({ ...event("plan.chosen"), actorName: null }, names)).toBe("Someone — plan chosen");
  });
});

describe("seats per plan (SPEC-373)", () => {
  it("adapts the payload", () => {
    expect(toSeats({ used: 2, limit: 10, remaining: 8, unlimited: false })).toEqual({
      used: 2,
      limit: 10,
      remaining: 8,
      unlimited: false,
    });
  });

  it("writes the header line for a limited and an unlimited plan", () => {
    const limited = { used: 7, limit: 10, remaining: 3, unlimited: false };
    expect(seatLine(limited, 7, 2)).toBe("7 of 10 members · 3 seats left");
    expect(seatLine({ used: 10, limit: 10, remaining: 0, unlimited: false }, 9, 1)).toBe(
      "10 of 10 members · 0 seats left",
    );
    expect(seatLine({ used: 9, limit: 10, remaining: 1, unlimited: false }, 9, 0)).toBe(
      "9 of 10 members · 1 seat left",
    );
    const unlimited = { used: 7, limit: null, remaining: null, unlimited: true };
    expect(seatLine(unlimited, 7, 0)).toBe("7 members");
    expect(seatLine(unlimited, 7, 2)).toBe("7 members · 2 invited");
    expect(seatLine(undefined, 1, 0)).toBe("1 member");
  });

  it("knows when the plan is full, and why", () => {
    expect(seatsFull({ used: 10, limit: 10, remaining: 0, unlimited: false })).toBe(true);
    expect(seatsFull({ used: 7, limit: 10, remaining: 3, unlimited: false })).toBe(false);
    expect(seatsFull({ used: 20, limit: null, remaining: null, unlimited: true })).toBe(false);
    expect(seatsFull(undefined)).toBe(false);
    expect(seatsFullReason({ used: 10, limit: 10, remaining: 0, unlimited: false })).toContain(
      "10 seats are all in use",
    );
  });
});
