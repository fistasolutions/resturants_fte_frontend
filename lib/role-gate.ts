import type { ActionNeed } from "@/lib/action-permissions";
import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";
import { can, isOwnerAccess, type TeamAccess } from "@/lib/team";

/**
 * Whether the signed-in member's role allows an action (frontend SPEC-358, root ABSOLUTE RULE
 * 13). Pure: `hooks/use-can.ts` feeds it the member's access from `/auth/me`. The server's route
 * policy (backend SPEC-317) is the guard; this only mirrors it so a member never meets a button
 * that ends in "permission denied".
 */
export interface RoleGateResult {
  allowed: boolean;
  /** Why not, in the member's words — null when allowed. */
  reason: string | null;
}

const ALLOWED: RoleGateResult = { allowed: true, reason: null };

/** What a call site asks for: one permission, several (all needed), or a registry entry. */
export type RoleNeed = Permission | readonly Permission[] | ActionNeed;

function needed(need: RoleNeed): readonly Permission[] | "member" | "owner" {
  return typeof need === "string" && need !== "member" && need !== "owner" ? [need] : need;
}

export function roleGate(access: TeamAccess | null | undefined, need: RoleNeed): RoleGateResult {
  // Unknown access (still loading, or an older backend): as today — the server decides.
  if (!access) return ALLOWED;
  const wanted = needed(need);
  if (wanted === "member") return ALLOWED;
  const role = access.roleName ?? "your role";
  if (wanted === "owner") {
    return isOwnerAccess(access)
      ? ALLOWED
      : { allowed: false, reason: `Only the store owner can do this. Your role is ${role}.` };
  }
  const missing = wanted.filter((permission) => !can(access, permission));
  if (missing.length === 0) return ALLOWED;
  const labels = missing.map((permission) => `“${PERMISSION_LABELS[permission]}”`).join(" and ");
  return {
    allowed: false,
    reason: `Your role (${role}) doesn't include ${labels}. Ask the store owner or an admin.`,
  };
}
