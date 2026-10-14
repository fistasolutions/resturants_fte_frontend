/**
 * `clientApi` — the browser-side twin of `serverApi` (SPEC-230).
 *
 * `"use client"` code can never hold the session token (it is an httpOnly cookie), so
 * every client read goes through `/api/proxy/<path>`, where the Next route handler
 * injects the bearer, streams the response back untouched and silently refreshes on a
 * 401 (SPEC-149). This helper takes the same backend-relative path `serverApi` takes
 * (`"/brief?start=…"`) so a query loader can be written once and run on either side.
 *
 * Same contract as `serverApi`: resolves the parsed JSON body, throws `ApiError`
 * carrying the backend's `{ error: { code, message } }` on any non-2xx.
 */
import { apiErrorFromResponse } from "@/lib/api-error";

const PROXY_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

/** `/brief?start=…` → `/api/proxy/brief?start=…` (the proxy prepends `/api/v1`). */
export function proxyUrl(path: string): string {
  return `${PROXY_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function clientApi<T>(path: string): Promise<T> {
  const response = await fetch(proxyUrl(path), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw await apiErrorFromResponse(response);
  }
  return (await response.json()) as T;
}
