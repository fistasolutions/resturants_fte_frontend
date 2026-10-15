/**
 * Local pages writes (frontend SPEC-386 / backend SPEC-403), through the proxy. Reads live in
 * `lib/queries/spotlight.ts`. Every function's permission is in `lib/action-permissions.ts`.
 */
import { proxyUrl } from "@/lib/client-api";
import { fromApi, toApi } from "@/lib/restaurant-api";
import { RestaurantRequestError } from "@/services/restaurant-actions";
import type { LocalPageEdit, LocalPagesData } from "@/types/local-pages";

const BASE = "/spotlight/local-pages";

async function send(method: string, path: string, body: unknown, fallback: string): Promise<LocalPagesData> {
  const response = await fetch(proxyUrl(path), {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string; details?: { message: string }[] } }
      | null;
    const details = (payload?.error?.details ?? []).map((d) => d.message);
    throw new RestaurantRequestError(
      details.length ? details.join(" ") : (payload?.error?.message ?? fallback),
      response.status,
    );
  }
  return fromApi<LocalPagesData>(await response.json());
}

export function writeLocalPage(branchId: number): Promise<LocalPagesData> {
  return send("POST", `${BASE}/${branchId}/write`, undefined, "Writing the page failed");
}

export function writeMissingLocalPages(): Promise<LocalPagesData> {
  return send("POST", `${BASE}/write-missing`, undefined, "Writing the pages failed");
}

export function editLocalPage(branchId: number, edit: LocalPageEdit): Promise<LocalPagesData> {
  return send("PATCH", `${BASE}/${branchId}`, toApi({ ...edit }), "Saving the page failed");
}

export function publishLocalPage(branchId: number): Promise<LocalPagesData> {
  return send("POST", `${BASE}/${branchId}/publish`, undefined, "Publishing the page failed");
}

export function unpublishLocalPage(branchId: number): Promise<LocalPagesData> {
  return send("POST", `${BASE}/${branchId}/unpublish`, undefined, "Taking the page down failed");
}
