/**
 * The Integrations hub's writes (SPEC-328 over backend SPEC-337): test a login without
 * saving it, start a sync now, and remove a key app's saved login. Every call goes through
 * the proxy; a failure throws the one `ApiError` carrying the backend's own sentence.
 */
import { apiErrorFromResponse } from "@/lib/api-error";
import { proxyUrl } from "@/lib/client-api";
import { toTestResult, type ApiTestResult } from "@/lib/integration-hub";
import type { TestResult } from "@/types/integrations";

async function send(path: string, method: "POST" | "DELETE", body?: unknown): Promise<Response> {
  const response = await fetch(proxyUrl(path), {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw await apiErrorFromResponse(response);
  return response;
}

/** Try a login with one read-only call. `fields` are the values typed but not yet saved. */
export async function testIntegration(key: string, fields: Record<string, string>): Promise<TestResult> {
  const response = await send(`/integrations/${key}/test`, "POST", { fields });
  return toTestResult((await response.json()) as ApiTestResult);
}

/** Start the connection's own sync; the overview shows it running. */
export async function syncIntegration(key: string): Promise<void> {
  await send(`/integrations/${key}/sync`, "POST");
}

/** Remove a key app's saved login. What it already synced stays. */
export async function disconnectIntegration(key: string): Promise<void> {
  await send(`/integrations/${key}`, "DELETE");
}
