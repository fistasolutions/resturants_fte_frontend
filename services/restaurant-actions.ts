/**
 * Restaurant brand writes (frontend SPEC-377 / backend SPEC-387–388) — client-side, through the
 * proxy. Reads live in `lib/queries/restaurant.ts`. Each write's permission is in
 * `lib/action-permissions.ts`, the same one the backend's route policy enforces.
 */
import { proxyUrl } from "@/lib/client-api";
import { fromApi, toApi } from "@/lib/restaurant-api";
import type {
  Branch,
  BranchImportReport,
  Franchisee,
  FranchiseRole,
  ImportKind,
  ImportReport,
  IngestKey,
  Region,
  RestaurantSetup,
} from "@/types/restaurant";

export class RestaurantRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RestaurantRequestError";
  }
}

async function send<T>(method: string, path: string, body?: unknown, fallback = "The request failed"): Promise<T> {
  const response = await fetch(proxyUrl(path), {
    method,
    headers: body === undefined || body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string; details?: { message: string }[] } }
      | null;
    const detail = payload?.error?.details?.[0]?.message;
    const message = payload?.error?.message ?? `${fallback} (${response.status}).`;
    throw new RestaurantRequestError(
      detail && response.status === 422 ? `${message} ${detail}` : message,
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return fromApi<T>(await response.json());
}

function upload(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

// ── setup ────────────────────────────────────────────────────────────────────

export function setUpRestaurant(input: { brandName: string; timezone: string; currency: string }): Promise<RestaurantSetup> {
  return send("POST", "/restaurant/setup", toApi(input), "Setting up the brand failed");
}

// ── regions ──────────────────────────────────────────────────────────────────

export function createRegion(name: string): Promise<Region> {
  return send("POST", "/restaurant/regions", { name }, "Adding the region failed");
}

export function renameRegion(id: number, name: string): Promise<Region> {
  return send("PATCH", `/restaurant/regions/${id}`, { name }, "Renaming the region failed");
}

export function deleteRegion(id: number): Promise<void> {
  return send("DELETE", `/restaurant/regions/${id}`, undefined, "Deleting the region failed");
}

// ── franchisees ──────────────────────────────────────────────────────────────

export interface FranchiseeInput {
  name: string;
  kind?: string;
  status?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  royaltyRate?: number;
  adFundRate?: number;
  agreementStart?: string | null;
  agreementEnd?: string | null;
  notes?: string | null;
}

export function createFranchisee(input: FranchiseeInput): Promise<Franchisee> {
  return send("POST", "/restaurant/franchisees", toApi({ ...input }), "Adding the franchisee failed");
}

export function updateFranchisee(id: number, input: Partial<FranchiseeInput>): Promise<Franchisee> {
  return send("PATCH", `/restaurant/franchisees/${id}`, toApi({ ...input }), "Saving the franchisee failed");
}

// ── branches ─────────────────────────────────────────────────────────────────

export interface BranchInput {
  code?: string;
  name?: string;
  externalRef?: string | null;
  status?: string;
  franchiseeId?: number | null;
  regionId?: number | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  ianaTimezone?: string | null;
  openedOn?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
}

export function createBranch(input: BranchInput): Promise<Branch> {
  return send("POST", "/restaurant/branches", toApi({ ...input }), "Adding the branch failed");
}

export function updateBranch(id: number, input: BranchInput): Promise<Branch> {
  return send("PATCH", `/restaurant/branches/${id}`, toApi({ ...input }), "Saving the branch failed");
}

export function importBranches(file: File, dryRun: boolean): Promise<BranchImportReport> {
  return send(
    "POST",
    `/restaurant/branches/import?dry_run=${dryRun}`,
    upload(file),
    "Importing the branches failed",
  );
}

// ── who sees what ────────────────────────────────────────────────────────────

export function setMemberScope(
  membershipId: number,
  franchiseeId: number | null,
  branchIds: number[] | null,
): Promise<{ membershipId: number; franchiseeId: number | null; branchIds: number[] | null }> {
  return send(
    "PUT",
    `/restaurant/members/${membershipId}/scope`,
    { franchisee_id: franchiseeId, branch_ids: branchIds },
    "Changing the access failed",
  );
}

// ── franchise teams ──────────────────────────────────────────────────────────

export function inviteToFranchise(
  franchiseeId: number,
  input: { email: string; roleKey: string; branchIds: number[] | null },
): Promise<{ id: number; email: string; roleKey: string; emailed: boolean }> {
  return send(
    "POST",
    `/restaurant/franchisees/${franchiseeId}/invitations`,
    { email: input.email, role_key: input.roleKey, branch_ids: input.branchIds },
    "Sending the invitation failed",
  );
}

export function createFranchiseRole(
  franchiseeId: number,
  input: { name: string; description: string; permissions: string[] },
): Promise<FranchiseRole> {
  return send("POST", `/restaurant/franchisees/${franchiseeId}/roles`, input, "Creating the role failed");
}

export function deleteFranchiseRole(franchiseeId: number, roleId: number): Promise<void> {
  return send(
    "DELETE",
    `/restaurant/franchisees/${franchiseeId}/roles/${roleId}`,
    undefined,
    "Deleting the role failed",
  );
}

// ── data in ──────────────────────────────────────────────────────────────────

export function createIngestKey(name: string): Promise<IngestKey & { key: string }> {
  return send("POST", "/restaurant/ingest-keys", { name }, "Creating the key failed");
}

export function revokeIngestKey(id: number): Promise<void> {
  return send("DELETE", `/restaurant/ingest-keys/${id}`, undefined, "Revoking the key failed");
}

export async function importRestaurantFile(kind: ImportKind, file: File, dryRun: boolean): Promise<ImportReport> {
  const report = await send<ImportReport>(
    "POST",
    `/restaurant/imports/${kind}?dry_run=${dryRun}`,
    upload(file),
    "Importing the file failed",
  );
  return { ...report, result: report.result ?? null };
}
