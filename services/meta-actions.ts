/**
 * Meta connect — client mutations (backend SPEC-179). Through `/api/proxy`, which
 * injects the httpOnly token server-side. Kept out of `services/meta.ts` because
 * that module is server-only (imports `serverApi`); this one is client-safe.
 */
import type { MetaStatus } from "@/types/integrations";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

/** A failed Meta action, carrying the backend's error code so a callback can say why a
 * connect was refused (SPEC-336 — `connect_started_elsewhere`, `connect_link_expired`, …). */
export class MetaActionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | null,
  ) {
    super(message);
    this.name = "MetaActionError";
  }
}

async function request<T>(
  path: string,
  method: "GET" | "POST" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new MetaActionError(
      payload?.error?.message ?? `Request failed (${res.status}).`,
      res.status,
      payload?.error?.code ?? null,
    );
  }
  return payload as T;
}

/** The Meta consent URL to redirect the browser to. Throws
 * `meta_not_configured` until the server has META_APP_ID/SECRET/redirect. */
export async function getMetaAuthorizeUrl(): Promise<string> {
  const { url } = await request<{ url: string }>(
    "/integrations/meta/authorize-url",
    "GET",
  );
  return url;
}

/** Exchange the OAuth `code` from Meta's callback; returns the connection status. */
export function exchangeMetaCode(code: string, state?: string | null): Promise<MetaStatus & { ads?: boolean }> {
  // SPEC-333: Meta's signed `state` goes back too — the one registered callback serves
  // Social Growth and the Performance Ads connection, and the state says which.
  return request<MetaStatus & { ads?: boolean }>("/integrations/meta/exchange", "POST", { code, state: state ?? null });
}

/** Disconnect Meta (best-effort revoke at Meta + local delete). */
export function disconnectMeta(): Promise<{ disconnected: boolean }> {
  return request<{ disconnected: boolean }>("/integrations/meta", "DELETE");
}
