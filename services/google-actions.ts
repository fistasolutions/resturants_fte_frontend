/**
 * Google Search Console connect — client mutations (backend SPEC-119). Like
 * every other client mutation in the app they go through `/api/proxy`, which
 * injects the httpOnly token server-side. Kept out of `services/google.ts`
 * because that module is server-only (imports `serverApi`); this one is
 * client-safe (the pure adapter + types only).
 */
import {
  adaptGoogleProperties,
  adaptGoogleStatus,
  type ApiGoogleProperties,
  type ApiGoogleStatus,
} from "@/lib/adapters";
import type { GoogleProperties, GoogleStatus } from "@/types/spotlight";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

/** A failed Google action, carrying the backend's error code so a card can react
 * to one specifically (`google_sync_running` → "already running"). */
export class GoogleActionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | null,
  ) {
    super(message);
    this.name = "GoogleActionError";
  }
}

async function request<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new GoogleActionError(
      payload?.error?.message ?? `Request failed (${res.status}).`,
      res.status,
      payload?.error?.code ?? null,
    );
  }
  return payload as T;
}

/** Fetch the Google consent URL to redirect the browser to (throws if the
 * server has no GOOGLE_* client configured). */
export async function getGoogleAuthorizeUrl(): Promise<string> {
  const { url } = await request<{ url: string }>(
    "/integrations/google/authorize-url",
    "GET",
  );
  return url;
}

/** Exchange the OAuth `code` from the callback for tokens; returns the resulting
 * connection status. */
export async function exchangeGoogleCode(code: string, state: string | null): Promise<GoogleStatus> {
  // SPEC-336 / backend SPEC-344: Google's signed `state` goes back — the backend refuses a
  // connect that this user, organization and store did not start in the last ten minutes.
  const raw = await request<ApiGoogleStatus>(
    "/integrations/google/exchange",
    "POST",
    { code, state },
  );
  return adaptGoogleStatus(raw);
}

/** Disconnect Google Search Console (best-effort revoke + local delete). */
export async function disconnectGoogle(): Promise<GoogleStatus> {
  const raw = await request<ApiGoogleStatus>("/integrations/google", "DELETE");
  return adaptGoogleStatus(raw);
}

/** The Search Console properties the connected account can see, ranked for the
 * picker (backend SPEC-257). One live call at Google; 409 when not connected. */
export async function getGoogleProperties(): Promise<GoogleProperties> {
  const raw = await request<ApiGoogleProperties>("/integrations/google/properties", "GET");
  return adaptGoogleProperties(raw);
}

/** Persist the owner's property choice; the backend validates it against Google's
 * list and starts the first pull at once — the returned status is already
 * `sync.state === "running"`. */
export async function chooseGoogleProperty(propertyUrl: string): Promise<GoogleStatus> {
  const raw = await request<ApiGoogleStatus>("/integrations/google/property", "PUT", {
    property_url: propertyUrl,
  });
  return adaptGoogleStatus(raw);
}

/** Sync now / Retry. Throws `GoogleActionError` with code `google_sync_running`
 * when a pull is already in flight. */
export async function syncGoogleNow(): Promise<GoogleStatus> {
  const raw = await request<ApiGoogleStatus>("/integrations/google/sync", "POST");
  return adaptGoogleStatus(raw);
}
