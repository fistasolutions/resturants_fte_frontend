/**
 * Team & Roles writes (SPEC-316) — client-side, through the proxy, throwing the shared
 * `ApiError` so a view shows the backend's own words (`owner_protected`, `role_in_use`, …).
 * Reads live in `lib/queries/team.ts`.
 */
import { apiErrorFromResponse } from "@/lib/api-error";
import { proxyUrl } from "@/lib/client-api";
import {
  toInvitation,
  toMember,
  toRole,
  type ApiInvitation,
  type ApiMember,
  type ApiRole,
  type Invitation,
  type Member,
  type Role,
  type RoleDraft,
} from "@/lib/team";

const BASE = "/organizations/current";

async function send(
  path: string,
  method: string,
  body?: unknown,
): Promise<Response> {
  const response = await fetch(proxyUrl(`${BASE}${path}`), {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw await apiErrorFromResponse(response);
  return response;
}

export async function inviteMember(
  email: string,
  roleKey: string,
): Promise<{ invitation: Invitation; emailed: boolean }> {
  const response = await send("/invitations", "POST", {
    email: email.trim(),
    role_key: roleKey,
  });
  const body = (await response.json()) as {
    invitation: ApiInvitation;
    emailed: boolean;
  };
  return { invitation: toInvitation(body.invitation), emailed: body.emailed };
}

export async function revokeInvitation(id: number): Promise<void> {
  await send(`/invitations/${id}`, "DELETE");
}

export async function updateMember(
  id: number,
  patch: { roleKey?: string; active?: boolean },
): Promise<Member> {
  const body: Record<string, unknown> = {};
  if (patch.roleKey !== undefined) body.role_key = patch.roleKey;
  if (patch.active !== undefined)
    body.status = patch.active ? "active" : "disabled";
  const response = await send(`/members/${id}`, "PATCH", body);
  return toMember((await response.json()) as ApiMember);
}

export async function removeMember(id: number): Promise<void> {
  await send(`/members/${id}`, "DELETE");
}

export async function transferOwnership(userId: number): Promise<void> {
  await send("/owner", "POST", { user_id: userId });
}

export async function createRole(draft: RoleDraft): Promise<Role> {
  const response = await send("/roles", "POST", {
    name: draft.name.trim(),
    description: draft.description.trim(),
    permissions: draft.permissions,
  });
  return toRole((await response.json()) as ApiRole);
}

export async function updateRole(key: string, draft: RoleDraft): Promise<Role> {
  const response = await send(`/roles/${encodeURIComponent(key)}`, "PATCH", {
    name: draft.name.trim(),
    description: draft.description.trim(),
    permissions: draft.permissions,
  });
  return toRole((await response.json()) as ApiRole);
}

export async function resetRole(key: string): Promise<Role> {
  const response = await send(
    `/roles/${encodeURIComponent(key)}/reset`,
    "POST",
  );
  return toRole((await response.json()) as ApiRole);
}

export async function deleteRole(key: string): Promise<void> {
  await send(`/roles/${encodeURIComponent(key)}`, "DELETE");
}
