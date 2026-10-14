import { describe, expect, it } from "vitest";

import { PERMISSION_LABELS, PERMISSIONS, isPermission } from "@/lib/permissions";
import { roleGate } from "@/lib/role-gate";
import type { TeamAccess } from "@/lib/team";

const owner: TeamAccess = { userId: 1, roleKey: "owner", roleName: "Owner", permissions: ["*"] };
const manager: TeamAccess = {
  userId: 2,
  roleKey: "manager",
  roleName: "Manager",
  permissions: ["social.view", "social.manage", "brief.manage"],
};

describe("roleGate", () => {
  it("allows the owner everything", () => {
    expect(roleGate(owner, "social.publish")).toEqual({ allowed: true, reason: null });
    expect(roleGate(owner, ["brief.manage", "messages.send"]).allowed).toBe(true);
    expect(roleGate(owner, "owner").allowed).toBe(true);
  });

  it("allows a member exactly their permissions", () => {
    expect(roleGate(manager, "social.manage").allowed).toBe(true);
    expect(roleGate(manager, "social.publish").allowed).toBe(false);
  });

  it("names the role and the missing permission's label", () => {
    expect(roleGate(manager, "social.publish").reason).toBe(
      `Your role (Manager) doesn't include “${PERMISSION_LABELS["social.publish"]}”. Ask the store owner or an admin.`,
    );
  });

  it("needs every permission of a list, and names only the missing ones", () => {
    const gate = roleGate(manager, ["brief.manage", "messages.send"]);
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toContain(PERMISSION_LABELS["messages.send"]);
    expect(gate.reason).not.toContain(PERMISSION_LABELS["brief.manage"]);
  });

  it("lets every member do member actions, and only the owner do owner actions", () => {
    expect(roleGate(manager, "member").allowed).toBe(true);
    const ownerOnly = roleGate(manager, "owner");
    expect(ownerOnly.allowed).toBe(false);
    expect(ownerOnly.reason).toBe("Only the store owner can do this. Your role is Manager.");
  });

  it("allows while the member's access is unknown — the server decides, as before", () => {
    expect(roleGate(null, "social.publish").allowed).toBe(true);
    expect(roleGate(undefined, ["messages.send"]).allowed).toBe(true);
  });

  it("falls back to plain words when the role has no name", () => {
    const nameless = { ...manager, roleName: null };
    expect(roleGate(nameless, "social.publish").reason).toContain("Your role (your role)");
  });
});

describe("the permission catalogue", () => {
  it("lists every key once, each with a label", () => {
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
    expect(PERMISSIONS.every((p) => PERMISSION_LABELS[p].length > 0)).toBe(true);
    expect(isPermission("social.publish")).toBe(true);
    expect(isPermission("social.publsh")).toBe(false);
  });
});
