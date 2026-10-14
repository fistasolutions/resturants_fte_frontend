import "server-only";

/**
 * Install from Shopify (SPEC-344) — the three backend calls, made by Route Handlers only.
 *
 * POSTs, built here rather than through `lib/api.ts`, whose `serverApi` is a GET (the same reason
 * as the QuickBooks callback). The claim and Shopify's code never reach page script.
 */
import { apiErrorFromResponse } from "@/lib/api-error";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export interface InstallStart {
  action: "open" | "authorize";
  url: string | null;
}

export interface InstallComplete {
  claim: string;
  shop_domain: string;
  name: string;
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw await apiErrorFromResponse(response);
  return (await response.json()) as T;
}

export function startInstall(query: Record<string, string>): Promise<InstallStart> {
  return post<InstallStart>("/shopify/install/start", { query });
}

export function completeInstall(query: Record<string, string>): Promise<InstallComplete> {
  return post<InstallComplete>("/shopify/install/complete", { query });
}

export function claimInstall(claim: string, token: string): Promise<{ shopify_domain: string }> {
  return post<{ shopify_domain: string }>("/stores/install/claim", { claim }, token);
}
