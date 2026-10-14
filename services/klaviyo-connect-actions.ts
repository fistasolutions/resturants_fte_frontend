/**
 * Connect with Klaviyo — the client writes (SPEC-371 over backend SPEC-379). Every call goes
 * through the proxy, which injects the httpOnly bearer; a failure throws the one `ApiError`
 * carrying the backend's own sentence. The code exchange itself happens server-side in
 * `app/api/integrations/klaviyo/callback/route.ts`, so no Klaviyo token ever reaches the
 * browser.
 */
import { apiErrorFromResponse } from "@/lib/api-error";
import { proxyUrl } from "@/lib/client-api";
import { klaviyoReturnCookie, type KlaviyoReturnPath } from "@/lib/klaviyo-connect";

const OAUTH = "/settings/integrations/klaviyo/oauth";

async function send(path: string, method: "GET" | "DELETE"): Promise<Response> {
  const response = await fetch(proxyUrl(path), { method, cache: "no-store" });
  if (!response.ok) throw await apiErrorFromResponse(response);
  return response;
}

/**
 * Start the round trip: ask for Klaviyo's consent URL at the moment of the click (its signed
 * state expires in ten minutes), remember where the connect started, and go to Klaviyo.
 * Throws the backend's sentence when the platform has no Klaviyo app set up (409).
 */
export async function startKlaviyoConnect(returnPath: KlaviyoReturnPath): Promise<void> {
  const response = await send(`${OAUTH}/authorize-url`, "GET");
  const { url } = (await response.json()) as { url: string };
  document.cookie = klaviyoReturnCookie(returnPath);
  window.location.assign(url);
}

/** Revoke the sign-in at Klaviyo and forget its tokens. A pasted key, if any, stays in force. */
export async function disconnectKlaviyoOAuth(): Promise<void> {
  await send(OAUTH, "DELETE");
}
