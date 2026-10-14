/**
 * CI Plans writes (SPEC-272) — client-side, through the proxy. Reads live in
 * `lib/queries/ci-plans.ts`; callers invalidate the `["ci-plans"]` prefix after a write.
 */
import { draftToBody, toCiPlan, type ApiCiPlan } from "@/lib/ci-plans";
import { proxyUrl } from "@/lib/client-api";
import type { CiPlan, PlanDraft } from "@/types/ci-plans";

export class PlanRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** The box a 422 names: "reason" | "instead" for a rejection. */
    readonly field: string | null = null,
  ) {
    super(message);
    this.name = "PlanRequestError";
  }
}

async function fail(response: Response, fallback: string): Promise<PlanRequestError> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string; details?: { field?: string; message?: string }[] } }
    | null;
  return new PlanRequestError(
    body?.error?.message ?? `${fallback} (${response.status}).`,
    response.status,
    body?.error?.details?.[0]?.field ?? null,
  );
}

export async function createPlan(draft: PlanDraft): Promise<CiPlan> {
  const response = await fetch(proxyUrl("/ci/plans"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draftToBody(draft)),
  });
  if (!response.ok) throw await fail(response, "Saving the plan failed");
  return toCiPlan((await response.json()) as ApiCiPlan);
}

export async function updatePlan(id: number, draft: PlanDraft): Promise<CiPlan> {
  const response = await fetch(proxyUrl(`/ci/plans/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draftToBody(draft)),
  });
  if (!response.ok) throw await fail(response, "Saving the plan failed");
  return toCiPlan((await response.json()) as ApiCiPlan);
}

/** Idempotent — 404 means it is already gone. */
export async function removePlan(id: number): Promise<void> {
  const response = await fetch(proxyUrl(`/ci/plans/${id}`), { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw await fail(response, "Removing the plan failed");
}

export async function acceptPlan(id: number, note = ""): Promise<CiPlan> {
  const response = await fetch(proxyUrl(`/ci/plans/${id}/decision`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision: "accept", note: note.trim() || null }),
  });
  if (!response.ok) throw await fail(response, "Saving the decision failed");
  return toCiPlan((await response.json()) as ApiCiPlan);
}

export async function rejectPlan(id: number, reason: string, instead: string): Promise<CiPlan> {
  const response = await fetch(proxyUrl(`/ci/plans/${id}/decision`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision: "reject", reason: reason.trim(), instead: instead.trim() }),
  });
  if (!response.ok) throw await fail(response, "Saving the decision failed");
  return toCiPlan((await response.json()) as ApiCiPlan);
}

/** SPEC-278 Patches: withdraw the decision — the plan is awaiting again. */
export async function revertDecision(id: number): Promise<CiPlan> {
  const response = await fetch(proxyUrl(`/ci/plans/${id}/decision`), { method: "DELETE" });
  if (!response.ok) throw await fail(response, "Reverting the decision failed");
  return toCiPlan((await response.json()) as ApiCiPlan);
}

export async function uploadPlanImage(id: number, file: File): Promise<CiPlan> {
  const form = new FormData();
  form.append("file", file, file.name);
  const response = await fetch(proxyUrl(`/ci/plans/${id}/image`), { method: "POST", body: form });
  if (!response.ok) throw await fail(response, "Uploading the image failed");
  return toCiPlan((await response.json()) as ApiCiPlan);
}

/** The `<img src>` for a plan's image — the proxy carries the session. A version
 * suffix busts the browser cache after a replacement. */
export function planImageHref(id: number, version: string | null = null): string {
  const base = proxyUrl(`/ci/plans/${id}/image`);
  return version ? `${base}?v=${encodeURIComponent(version)}` : base;
}
