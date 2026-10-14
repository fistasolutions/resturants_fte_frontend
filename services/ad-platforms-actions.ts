/**
 * Performance Ads ← real ad accounts — client writes (SPEC-333 / backend SPEC-342),
 * through the proxy. "Writes" are to our own database: connect, choose accounts, read now,
 * disconnect. Nothing here changes anything in an ad account — the connection is read-only.
 * Callers invalidate the `["ads"]` prefix afterwards.
 */
import { proxyUrl } from "@/lib/client-api";

async function call<T>(path: string, init: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(proxyUrl(path), init);
  const body = (await response.json().catch(() => null)) as (T & { error?: { message?: string } }) | null;
  if (!response.ok) throw new Error(body?.error?.message ?? `${fallback} (${response.status}).`);
  return body as T;
}

/** Meta's consent page for a read-only Ads connection. */
export async function metaAdsAuthorizeUrl(): Promise<string> {
  const body = await call<{ url: string }>("/ads/platforms/meta/authorize-url", {}, "Starting the Meta connection failed");
  return body.url;
}

export async function chooseAdAccounts(accountIds: string[]): Promise<void> {
  await call(
    "/ads/platforms/meta/accounts",
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_ids: accountIds }) },
    "Saving the ad accounts failed",
  );
}

export interface AdSyncResult {
  busy: boolean;
  accounts: number;
  message?: string;
  error?: string;
}

export async function syncAdAccounts(): Promise<AdSyncResult> {
  return call<AdSyncResult>("/ads/platforms/meta/sync", { method: "POST" }, "Reading the ad accounts failed");
}

export async function disconnectMetaAds(): Promise<void> {
  await call("/ads/platforms/meta", { method: "DELETE" }, "Disconnecting Meta Ads failed");
}
