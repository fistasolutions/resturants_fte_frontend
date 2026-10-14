/**
 * Onboarding (SPEC-313). Reads run on the server (`serverApi`); the browser's writes go
 * through `/api/proxy` — except creating the organization, which mints new tokens and so
 * goes through `/api/session` like every other sign-in.
 */
import { ApiError } from "@/lib/api-error";
import { proxyUrl } from "@/lib/client-api";
import type { BootstrapPayload } from "@/lib/onboarding";

async function send<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(proxyUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.code ?? "request_failed",
      data?.error?.message ?? "Something went wrong. Try again.",
    );
  }
  return data as T;
}

export async function createOrganization(name: string): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "organization", name }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      data?.error?.code ?? "request_failed",
      data?.error?.message ?? "Could not create the company.",
    );
  }
}

export async function choosePlan(planKey: string): Promise<void> {
  await send("/billing/subscription", { plan_key: planKey });
}

/** SPEC-321: a Stripe Checkout page for the plan. */
export async function startCheckout(planKey: string): Promise<string> {
  return (await send<{ url: string }>("/billing/checkout", { plan_key: planKey })).url;
}

/** SPEC-321: back from Stripe — record the paid plan (safe to repeat). */
export async function confirmCheckout(sessionId: string): Promise<void> {
  await send("/billing/checkout/confirm", { session_id: sessionId });
}

export async function connectStoreUrl(shop: string): Promise<string> {
  return (await send<{ url: string }>("/stores/connect/start", { shop })).url;
}

export async function finishStoreConnect(query: Record<string, string>): Promise<void> {
  await send("/stores/connect/callback", { query });
}

export async function readBootstrap(): Promise<BootstrapPayload> {
  const response = await fetch(proxyUrl("/stores/current/bootstrap"), { cache: "no-store" });
  if (!response.ok) throw new ApiError(response.status, "request_failed", "Could not read progress.");
  return (await response.json()) as BootstrapPayload;
}

export async function retryBootstrap(): Promise<void> {
  await send("/stores/current/bootstrap/retry");
}
