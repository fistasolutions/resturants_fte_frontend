/**
 * Connect with Gorgias — the client writes (SPEC-372 over backend SPEC-380). Every call goes
 * through the proxy, which injects the httpOnly bearer; a failure throws the one `ApiError`
 * carrying the backend's own sentence. The code exchange itself happens server-side in
 * `app/api/integrations/gorgias/callback/route.ts`, so no Gorgias token ever reaches the
 * browser.
 */
import { apiErrorFromResponse } from "@/lib/api-error";
import { proxyUrl } from "@/lib/client-api";

const OAUTH = "/settings/integrations/gorgias/oauth";

async function send(path: string, method: "GET" | "DELETE"): Promise<Response> {
  const response = await fetch(proxyUrl(path), { method, cache: "no-store" });
  if (!response.ok) throw await apiErrorFromResponse(response);
  return response;
}

/**
 * Start the round trip on the store's own Gorgias account: ask for the consent URL at the
 * moment of the click (its signed state expires in ten minutes) and go there. Throws the
 * backend's sentence when the platform has no Gorgias app set up (409) or the subdomain is
 * refused (422).
 */
export async function startGorgiasConnect(subdomain: string): Promise<void> {
  const query = new URLSearchParams({ account: subdomain }).toString();
  const response = await send(`${OAUTH}/authorize-url?${query}`, "GET");
  const { url } = (await response.json()) as { url: string };
  window.location.assign(url);
}

/** Revoke the sign-in at Gorgias and forget its tokens. A pasted key, if any, stays in force. */
export async function disconnectGorgiasOAuth(): Promise<void> {
  await send(OAUTH, "DELETE");
}
